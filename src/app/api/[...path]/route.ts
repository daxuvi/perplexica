import * as chatHandler from '@/lib/api/chat';
import * as chatsHandler from '@/lib/api/chats';
import * as chatsIdHandler from '@/lib/api/chatsId';
import * as configHandler from '@/lib/api/config';
import * as setupCompleteHandler from '@/lib/api/setupComplete';
import * as discoverHandler from '@/lib/api/discover';
import * as imagesHandler from '@/lib/api/images';
import * as videosHandler from '@/lib/api/videos';
import * as searchHandler from '@/lib/api/search';
import * as suggestionsHandler from '@/lib/api/suggestions';
import * as uploadsHandler from '@/lib/api/uploads';
import * as weatherHandler from '@/lib/api/weather';
import * as providersHandler from '@/lib/api/providers';
import * as providersIdHandler from '@/lib/api/providersId';
import * as providerModelsHandler from '@/lib/api/providerModels';
import * as reconnectHandler from '@/lib/api/reconnect';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function dispatch(req: any, path: string[]) {
  const method = req.method;
  const p0 = path[0];

  if (p0 === 'chat' && method === 'POST') {
    return chatHandler.POST(req);
  }

  if (p0 === 'chats') {
    if (path.length === 1 && method === 'GET') {
      return chatsHandler.GET(req);
    } else if (path.length === 2) {
      const idParams = { params: Promise.resolve({ id: path[1] }) };
      if (method === 'GET') return chatsIdHandler.GET(req, idParams);
      if (method === 'DELETE') return chatsIdHandler.DELETE(req, idParams);
    }
  }

  if (p0 === 'config') {
    if (path.length === 1) {
      if (method === 'GET') return configHandler.GET(req);
      if (method === 'POST') return configHandler.POST(req);
    } else if (path.length === 2 && path[1] === 'setup-complete' && method === 'POST') {
      return setupCompleteHandler.POST(req);
    }
  }

  if (p0 === 'discover' && method === 'GET') {
    return discoverHandler.GET(req);
  }

  if (p0 === 'images' && method === 'POST') {
    return imagesHandler.POST(req);
  }

  if (p0 === 'videos' && method === 'POST') {
    return videosHandler.POST(req);
  }

  if (p0 === 'search' && method === 'POST') {
    return searchHandler.POST(req);
  }

  if (p0 === 'suggestions' && method === 'POST') {
    return suggestionsHandler.POST(req);
  }

  if (p0 === 'uploads' && method === 'POST') {
    return uploadsHandler.POST(req);
  }

  if (p0 === 'weather' && method === 'POST') {
    return weatherHandler.POST(req);
  }

  if (p0 === 'providers') {
    if (path.length === 1) {
      if (method === 'GET') return providersHandler.GET(req);
      if (method === 'POST') return providersHandler.POST(req);
    } else if (path.length === 2 && method === 'DELETE') {
      const idParams = { params: Promise.resolve({ id: path[1] }) };
      return providersIdHandler.DELETE(req, idParams);
    } else if (path.length === 3 && path[2] === 'models' && method === 'POST') {
      const idParams = { params: Promise.resolve({ id: path[1] }) };
      return providerModelsHandler.POST(req, idParams);
    }
  }

  if (p0 === 'reconnect' && path.length === 2 && method === 'POST') {
    const idParams = { params: Promise.resolve({ id: path[1] }) };
    return reconnectHandler.POST(req, idParams);
  }

  return Response.json({ message: 'API route not found' }, { status: 404 });
}

export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return dispatch(req, path);
}

export async function POST(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return dispatch(req, path);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return dispatch(req, path);
}
