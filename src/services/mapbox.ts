const API_BASE = 'https://api.mapbox.com';

export interface MapboxStyle {
  id: string;
  name: string;
  url?: string;
  thumbnail_url?: string;
}

// Fetch all accessible map styles (paginated)
export async function fetchMapStyles(token: string): Promise<MapboxStyle[]> {
  const styles: MapboxStyle[] = [];
  let after = '';

  do {
    const params = new URLSearchParams({ access_token: token, limit: '100' });
    if (after) params.set('after', after);

    const resp = await fetch(`${API_BASE}/styles/v1/me?${params}`);
    if (!resp.ok) throw new Error(`Mapbox API error: ${resp.status} - ${await resp.text()}`);

    const data = await resp.json();
    const items = data.features || [];
    styles.push(...items.map((f: any) => ({
      id: f.id,
      name: f.name,
      url: f.url,
      thumbnail_url: f.thumbnail_url,
    })));

    after = data.hasNext ? styles[styles.length - 1].id : '';
  } while (false); // Single fetch for now; pagination added if >100 maps

  return styles;
}

// Create a tileset upload job
export async function createTilesetUpload(
  secretToken: string,
  fileName: string
): Promise<{ uploadId: string }> {
  const resp = await fetch(`${API_BASE}/tilesets/v1/uploads?access_token=${secretToken}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: fileName }),
  });

  if (!resp.ok) throw new Error(`Failed to create upload: ${await resp.text()}`);

  const data = await resp.json();
  return { uploadId: data.id };
}

// Get the URL for uploading a file
export async function getUploadUrl(
  secretToken: string,
  uploadId: string
): Promise<{ url: string; publicUrl: string }> {
  const resp = await fetch(
    `${API_BASE}/tilesets/v1/uploads/${uploadId}?access_token=${secretToken}`,
    { method: 'PUT' }
  );

  if (!resp.ok) throw new Error(`Failed to get upload URL: ${await resp.text()}`);

  const data = await resp.json();
  return { url: data.upload, publicUrl: data.url };
}

// Poll tileset upload status
export async function pollUploadStatus(
  secretToken: string,
  uploadId: string
): Promise<{ state: string; error: string | null }> {
  const resp = await fetch(
    `${API_BASE}/tilesets/v1/uploads/${uploadId}?access_token=${secretToken}`
  );

  if (!resp.ok) throw new Error(`Failed to poll upload status: ${await resp.text()}`);

  const data = await resp.json();
  return {
    state: data.state,
    error: data.messages?.find((m: any) => m.level === 'error')?.message ?? null,
  };
}

// Add a raster layer to a Mapbox style
export async function addRasterLayer(
  accessToken: string,
  styleId: string,
  tilesetId: string,
  layerName = 'drone-overlay'
): Promise<void> {
  const resp = await fetch(
    `${API_BASE}/styles/v1/${encodeURIComponent(styleId)}?access_token=${accessToken}`,
    { method: 'GET' }
  );

  if (!resp.ok) throw new Error(`Failed to fetch style: ${await resp.text()}`);

  const style = await resp.json();

  // Build the raster layer config
  const layerDef = {
    id: layerName,
    type: 'raster',
    source: tilesetId.split('.')[1] || 'mapbox',
    'source-layer': '*',
    paint: {
      'raster-opacity': 0.9,
      'raster-fade-duration': 300,
    },
  };

  // Insert after the first background layer (or at top if none)
  const sources = style.sources || {};
  const existingSource = sources[tilesetId];
  if (!existingSource) {
    sources[tilesetId] = {
      type: 'raster-tiles',
      tiles: [`https://tiles.mapbox.com/v1/{tileset_id}/png256/?z={z}&x={x}&y={y}&token=access_token`].map(
        (t) => t.replace('{tileset_id}', tilesetId).replace('access_token', accessToken)
      ),
      tileSize: 256,
    };
  }

  style.sources = sources;

  const sourceLayers = (style.layers || []).filter((l: any) => l.source && !l.id.startsWith(layerName));
  if (sourceLayers.length > 0) {
    style.layers.splice(sourceLayers[0].id === layerName ? 0 : 1, 0, layerDef);
  } else {
    style.layers = [layerDef, ...(style.layers || [])];
  }

  // Save the updated style
  const saveResp = await fetch(
    `${API_BASE}/styles/v1/${encodeURIComponent(styleId)}?access_token=${accessToken}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(style),
    }
  );

  if (!saveResp.ok) throw new Error(`Failed to update style: ${await saveResp.text()}`);
}

// Get upload state for status display
export interface UploadStateInfo {
  state: string;
  progress: number;
  error: string | null;
}

export async function getUploadProgress(
  secretToken: string,
  uploadId: string
): Promise<UploadStateInfo> {
  const resp = await fetch(
    `${API_BASE}/tilesets/v1/uploads/${uploadId}?access_token=${secretToken}`
  );

  if (!resp.ok) throw new Error(`Failed to get upload progress: ${await resp.text()}`);

  const data = await resp.json();
  return {
    state: data.state,
    progress: (data.progress || 0) * 100,
    error: data.messages?.find((m: any) => m.level === 'error')?.message ?? null,
  };
}
