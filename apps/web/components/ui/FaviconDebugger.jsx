'use client';

import { useEffect, useState } from 'react';
import { useWebsiteSettings, DEFAULT_SETTINGS } from '@/store/settingsStore';
import { resolveAssetUrl } from '@/lib/assetUrl';

export default function FaviconDebugger() {
  const { settings } = useWebsiteSettings();
  const [faviconInfo, setFaviconInfo] = useState(null);
  const [domLinks, setDomLinks] = useState([]);
  const [fileExists, setFileExists] = useState(null);

  useEffect(() => {
    if (!settings || typeof document === 'undefined') return;

    // Get favicon info
    const rawFaviconUrl = settings?.favicon_url || DEFAULT_SETTINGS.favicon_url;
    const resolvedUrl = resolveAssetUrl(rawFaviconUrl, DEFAULT_SETTINGS.favicon_url);

    setFaviconInfo({
      raw: rawFaviconUrl,
      resolved: resolvedUrl,
      default: DEFAULT_SETTINGS.favicon_url,
    });

    // Get current favicon links from DOM
    const links = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]');
    const linkData = Array.from(links).map(link => ({
      rel: link.rel,
      href: link.href,
    }));
    setDomLinks(linkData);

    // Check if file exists
    if (resolvedUrl) {
      fetch(resolvedUrl, { method: 'HEAD' })
        .then(res => {
          setFileExists({
            status: res.status,
            ok: res.ok,
            contentType: res.headers.get('content-type'),
          });
        })
        .catch(err => {
          setFileExists({
            status: null,
            ok: false,
            error: err.message,
          });
        });
    }
  }, [settings]);

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 mt-4 text-sm space-y-3">
      <h3 className="text-white font-bold text-base">🔍 Favicon Debug Info</h3>

      {/* Favicon URLs */}
      <div className="bg-slate-800/50 rounded p-3 space-y-2">
        <p className="text-slate-300"><span className="text-amber-400">Raw URL:</span> <code className="text-xs bg-slate-900 px-2 py-1 rounded">{faviconInfo?.raw}</code></p>
        <p className="text-slate-300"><span className="text-amber-400">Resolved URL:</span> <code className="text-xs bg-slate-900 px-2 py-1 rounded break-all">{faviconInfo?.resolved}</code></p>
        <p className="text-slate-300"><span className="text-amber-400">Default:</span> <code className="text-xs bg-slate-900 px-2 py-1 rounded">{faviconInfo?.default}</code></p>
      </div>

      {/* File Existence Check */}
      {fileExists && (
        <div className="bg-slate-800/50 rounded p-3">
          <p className="text-slate-300 mb-2">
            <span className="text-amber-400">File Status:</span>
            {fileExists.ok ? (
              <span className="ml-2 text-green-400 font-bold">✅ File exists (Status {fileExists.status})</span>
            ) : (
              <span className="ml-2 text-red-400 font-bold">❌ File not found (Status {fileExists.status})</span>
            )}
          </p>
          {fileExists.contentType && (
            <p className="text-slate-400 text-xs">Content-Type: {fileExists.contentType}</p>
          )}
          {fileExists.error && (
            <p className="text-red-400 text-xs">Error: {fileExists.error}</p>
          )}
        </div>
      )}

      {/* DOM Links */}
      <div className="bg-slate-800/50 rounded p-3">
        <p className="text-slate-300 mb-2"><span className="text-amber-400">DOM Favicon Links:</span> {domLinks.length} found</p>
        {domLinks.length > 0 ? (
          <div className="space-y-1">
            {domLinks.map((link, idx) => (
              <div key={idx} className="text-xs text-slate-400">
                <p>rel="{link.rel}" → <code className="text-cyan-400 break-all">{link.href}</code></p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-red-400 text-xs">⚠️ No favicon links found in DOM</p>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-900/30 border border-blue-700/50 rounded p-3 text-blue-300 text-xs">
        <p className="font-bold mb-1">📋 Debug Steps:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Check "Resolved URL" - is it correct? Does file exist at that path?</li>
          <li>Check "File Status" - should show ✅ File exists</li>
          <li>Check "DOM Favicon Links" - should show 2 links with favicon URL</li>
          <li>If file doesn't exist, upload favicon in Settings</li>
          <li>If URL is wrong, check Settings page favicon_url value</li>
          <li>Open DevTools Network tab → Search for favicon request</li>
        </ol>
      </div>
    </div>
  );
}
