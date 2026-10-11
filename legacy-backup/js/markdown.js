/**
 * Lightweight, robust Markdown & Citation Parser
 */

export const Markdown = {
  escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  render(md) {
    if (!md) return '';

    let html = md;

    // Code blocks with syntax copy button
    const codeBlocks = [];
    html = html.replace(/```([a-zA-Z0-9_\-\.]*)\n([\s\S]*?)```/g, (match, lang, code) => {
      const id = `code_block_${codeBlocks.length}`;
      const language = lang || 'code';
      const escapedCode = this.escapeHtml(code.trim());
      
      const blockHtml = `
        <div class="code-wrapper">
          <div class="code-header-bar">
            <span>${language}</span>
            <button class="btn-copy-code" onclick="navigator.clipboard.writeText(decodeURIComponent('${encodeURIComponent(code.trim())}')).then(() => { this.innerText = '✓ Copied'; setTimeout(() => this.innerText = 'Copy', 2000); })">
              📋 Copy
            </button>
          </div>
          <pre><code class="language-${language}">${escapedCode}</code></pre>
        </div>
      `;
      codeBlocks.push(blockHtml);
      return `###CODE_PLACEHOLDER_${codeBlocks.length - 1}###`;
    });

    // Inline code
    html = html.replace(/`([^`]+)`/g, (m, inlineCode) => {
      return `<code>${this.escapeHtml(inlineCode)}</code>`;
    });

    // Tables
    html = html.replace(/(?:(?:^|\n)\|.+)+\|(?:\n|$)/g, (tableText) => {
      const lines = tableText.trim().split('\n');
      if (lines.length < 2) return tableText;

      let tableHtml = '<table>';
      const headerCols = lines[0].split('|').map(c => c.trim()).filter((c, i, a) => i !== 0 && i !== a.length - 1);
      
      tableHtml += '<thead><tr>';
      headerCols.forEach(col => {
        tableHtml += `<th>${col}</th>`;
      });
      tableHtml += '</tr></thead><tbody>';

      for (let i = 2; i < lines.length; i++) {
        const rowCols = lines[i].split('|').map(c => c.trim()).filter((c, idx, a) => idx !== 0 && idx !== a.length - 1);
        if (rowCols.length > 0) {
          tableHtml += '<tr>';
          rowCols.forEach(col => {
            tableHtml += `<td>${col}</td>`;
          });
          tableHtml += '</tr>';
        }
      }
      tableHtml += '</tbody></table>';
      return tableHtml;
    });

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Blockquotes
    html = html.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>');

    // Bold & Italic
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Unordered lists
    html = html.replace(/^\s*[\-\*]\s+(.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/gims, (m) => {
      return `<ul>${m}</ul>`;
    });
    // Clean multiple nested uls
    html = html.replace(/<\/ul>\s*<ul>/g, '');

    // Links [Text](URL)
    html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Citations [1], [2], etc. -> interactive badge
    html = html.replace(/\[(\d+)\]/g, (match, num) => {
      return `<button type="button" class="citation-badge" data-cite="${num}" title="Nguồn [${num}]" onclick="window.highlightSourceCard && window.highlightSourceCard(${num})">${num}</button>`;
    });

    // Paragraphs
    const paragraphs = html.split(/\n{2,}/);
    html = paragraphs.map(p => {
      p = p.trim();
      if (!p) return '';
      if (p.startsWith('<h') || p.startsWith('<pre') || p.startsWith('<ul>') || p.startsWith('<table') || p.startsWith('<blockquote') || p.startsWith('###CODE')) {
        return p;
      }
      return `<p>${p.replace(/\n/g, '<br>')}</p>`;
    }).join('\n');

    // Restore code blocks
    codeBlocks.forEach((block, idx) => {
      html = html.replace(`###CODE_PLACEHOLDER_${idx}###`, block);
    });

    return html;
  }
};
