/**
 * Google Gemini API Client with Native Search Grounding
 */

const SYSTEM_PROMPTS = {
  web: `Bạn là trợ lý nghiên cứu và tìm kiếm thông tin thông minh Perplexica Pro.
Nhiệm vụ của bạn là trả lời chính xác, sâu sắc và cập nhật nhất dựa trên kết quả tìm kiếm web.
Quy tắc:
1. Luôn trích dẫn nguồn số thứ tự dạng [1], [2], [3] ngay cạnh các sự kiện/thông tin bạn trích từ kết quả tìm kiếm.
2. Trình bày bằng tiếng Việt rõ ràng, mạch lạc, dùng định dạng Markdown (tiêu đề, gạch đầu dòng, bảng biểu, in đậm).
3. Khách quan, trung thực và nêu bật những điểm quan trọng nhất.`,

  pro: `Bạn là chuyên gia nghiên cứu sâu (Deep Research Engine) của Perplexica Pro, sử dụng mô hình Gemini Pro cao cấp nhất.
Nhiệm vụ của bạn là phân tích toàn diện, đa chiều và chuyên sâu như Perplexity Pro Deep Research.
Quy tắc:
1. Chia nhỏ vấn đề: Bối cảnh, Phân tích cốt lõi, So sánh các luồng quan điểm/giải pháp, Kết luận & Xu hướng.
2. Trích dẫn số [1], [2], [3] tương ứng với các nguồn thông tin.
3. Sử dụng số liệu, dẫn chứng thực tế và lập luận logic chặt chẽ.
4. Trình bày bằng Markdown cao cấp, có cấu trúc rõ ràng.`,

  academic: `Bạn là trợ lý học thuật chuyên sâu. Hãy giải thích và trả lời theo tiêu chuẩn nghiên cứu khoa học, viện dẫn các tài liệu, bài báo hoặc khái niệm chính xác, kèm số trích dẫn [1], [2].`,

  code: `Bạn là kỹ sư phần mềm cao cấp (Staff Software Engineer). Cung cấp giải pháp lập trình tối ưu, giải thích thuật toán, độ phức tạp Time/Space, kèm code mẫu chuẩn và xử lý trường hợp biên (edge cases).`,

  writing: `Bạn là trợ lý sáng tạo và biên tập nội dung chuyên nghiệp. Viết nội dung mượt mà, văn phong cuốn hút, từ ngữ chọn lọc và cấu trúc hấp dẫn.`
};

export const GeminiService = {
  async testApiKey(apiKey, model = 'gemini-flash-latest') {
    if (!apiKey) return { success: false, error: 'Chưa nhập API key' };
    
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Xin chào, hãy trả lời ngắn "OK"' }] }]
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.message || `HTTP ${res.status}`);
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async checkServerConfig() {
    try {
      const res = await fetch('/api/gemini/info');
      if (res.ok) {
        const data = await res.json();
        return data.hasServerKey;
      }
      return false;
    } catch {
      return false;
    }
  },

  async searchAndAnswer({
    apiKey,
    model = 'gemini-1.5-pro',
    prompt,
    mode = 'web',
    attachment = null,
    history = [],
    enableGrounding = true,
    temperature = 0.7,
    onStepUpdate = () => {},
    onStreamChunk = () => {}
  }) {
    onStepUpdate({ step: 'searching', message: 'Đang gửi truy vấn và tìm kiếm thông tin thời gian thực...' });

    // Build contents
    const contents = [];

    // Prior chat history
    if (history && history.length > 0) {
      history.slice(-6).forEach(msg => {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        });
      });
    }

    // Current user message parts
    const currentParts = [];
    if (attachment && attachment.data && attachment.mimeType) {
      currentParts.push({
        inlineData: {
          mimeType: attachment.mimeType,
          data: attachment.data
        }
      });
    }
    currentParts.push({ text: prompt });

    contents.push({
      role: 'user',
      parts: currentParts
    });

    // Request payload
    const requestData = {
      contents,
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.web }]
      },
      generationConfig: {
        temperature: mode === 'pro' ? 0.3 : (temperature !== undefined ? Number(temperature) : 0.7),
        maxOutputTokens: 8192
      }
    };

    // Add Google Search Grounding for modes that need web search
    if (enableGrounding && mode !== 'writing') {
      requestData.tools = [{ googleSearch: {} }];
    }

    onStepUpdate({ step: 'synthesizing', message: 'Gemini đang phân tích và tìm kiếm dữ liệu...' });

    let answerText = '';
    const sources = [];
    let searchQueries = [];

    // Try Streaming First
    let streamSuccess = false;
    try {
      let streamRes = null;
      if (apiKey) {
        const streamUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;
        streamRes = await fetch(streamUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData)
        });
      }

      // If direct stream failed or no client apiKey, fallback to local/vercel proxy stream
      if (!streamRes || !streamRes.ok) {
        streamRes = await fetch('/api/gemini/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey, model, requestData, stream: true })
        });
      }

      if (streamRes.ok && streamRes.body) {
        const reader = streamRes.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop(); // keep partial line

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              const jsonStr = trimmed.slice(6).trim();
              if (!jsonStr || jsonStr === '[DONE]') continue;
              try {
                const parsed = JSON.parse(jsonStr);
                const candidate = parsed.candidates?.[0];
                if (candidate) {
                  // Extract text
                  const chunkText = candidate.content?.parts?.map(p => p.text).join('') || '';
                  if (chunkText) {
                    answerText += chunkText;
                  }

                  // Extract grounding metadata
                  const grounding = candidate.groundingMetadata;
                  if (grounding) {
                    if (grounding.webSearchQueries && grounding.webSearchQueries.length > 0) {
                      grounding.webSearchQueries.forEach(q => {
                        if (!searchQueries.includes(q)) searchQueries.push(q);
                      });
                    }
                    if (grounding.groundingChunks && grounding.groundingChunks.length > 0) {
                      grounding.groundingChunks.forEach(chunk => {
                        if (chunk.web && chunk.web.uri) {
                          let domain = '';
                          try {
                            domain = new URL(chunk.web.uri).hostname.replace('www.', '');
                          } catch {
                            domain = 'web';
                          }
                          if (!sources.some(s => s.url === chunk.web.uri)) {
                            sources.push({
                              index: sources.length + 1,
                              title: chunk.web.title || domain,
                              url: chunk.web.uri,
                              domain: domain,
                              favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
                            });
                          }
                        }
                      });
                    }
                  }

                  onStreamChunk({
                    text: answerText,
                    sources: [...sources],
                    searchQueries: [...searchQueries]
                  });
                }
              } catch (e) {
                // Ignore json chunk parse error
              }
            }
          }
        }

        if (answerText.trim().length > 0) {
          streamSuccess = true;
        }
      }
    } catch (streamErr) {
      console.warn('Streaming encountered an error, trying standard fetch fallback:', streamErr);
    }

    // Fallback to standard generateContent if streaming didn't return text
    if (!streamSuccess) {
      let responseData = null;
      try {
        if (apiKey) {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
          });
          if (res.ok) {
            responseData = await res.json();
          }
        }
      } catch (e) {
        // Fallback to proxy below
      }

      if (!responseData) {
        const proxyRes = await fetch('/api/gemini/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey, model, requestData, stream: false })
        });
        if (!proxyRes.ok) {
          const errData = await proxyRes.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${proxyRes.status}`);
        }
        responseData = await proxyRes.json();
      }

      const candidate = responseData?.candidates?.[0];
      if (!candidate) {
        throw new Error('Không nhận được phản hồi từ Google Gemini.');
      }

      answerText = candidate.content?.parts?.map(p => p.text).join('') || '';

      const grounding = candidate.groundingMetadata || {};
      searchQueries = grounding.webSearchQueries || [];
      const rawChunks = grounding.groundingChunks || [];

      rawChunks.forEach((chunk, index) => {
        if (chunk.web && chunk.web.uri) {
          let domain = '';
          try {
            domain = new URL(chunk.web.uri).hostname.replace('www.', '');
          } catch {
            domain = 'web';
          }
          sources.push({
            index: index + 1,
            title: chunk.web.title || domain,
            url: chunk.web.uri,
            domain: domain,
            favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
          });
        }
      });
    }

    onStepUpdate({ step: 'completed', message: 'Hoàn tất!' });

    // Generate related questions asynchronously
    const relatedQuestions = await this.generateRelatedQuestions({
      apiKey,
      model: 'gemini-1.5-flash',
      query: prompt,
      answer: answerText
    });

    return {
      text: answerText,
      sources,
      searchQueries,
      relatedQuestions
    };
  },

  async generateRelatedQuestions({ apiKey, model = 'gemini-1.5-flash', query, answer }) {
    try {
      const requestData = {
        contents: [{
          parts: [{
            text: `Dựa trên câu hỏi "${query}" và câu trả lời tóm tắt sau:
"${answer.substring(0, 1000)}"

Hãy gợi ý đúng 3 câu hỏi đào sâu hoặc tiếp theo thú vị nhất (bằng tiếng Việt) mà người dùng có thể muốn hỏi tiếp.
Chỉ trả về 3 câu hỏi phân cách bởi dấu xuống dòng, không thêm số thứ tự, không thêm lời chào.`
          }]
        }]
      };

      let res = null;
      if (apiKey) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData)
        });
      }

      if (!res || !res.ok) {
        res = await fetch('/api/gemini/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey, model, requestData, stream: false })
        });
      }

      if (!res.ok) return [];
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return text
        .split('\n')
        .map(q => q.replace(/^[\d\.\-\*\s]+/, '').trim())
        .filter(q => q.length > 5)
        .slice(0, 3);
    } catch {
      return [];
    }
  }
};
