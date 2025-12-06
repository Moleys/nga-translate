// BBCode Parser - wrapper for ThreadReader.parseContent
const BBCodeParser = {
    parse(content, attachPrefix) {
        if (!content) return '<p class="text-muted">No content</p>';

        let parsed = content;

        // Add CORS proxy to video URLs (src and poster attributes)
        const videoProxyUrl = 'https://cors.moldich.eu.org/?q=';

        // Replace video src and poster attributes together
        parsed = parsed.replace(/<video([^>]*)>/gi, (match, attrs) => {
            let modifiedAttrs = attrs;

            // Replace src attribute
            modifiedAttrs = modifiedAttrs.replace(/\ssrc=["']([^"']+)["']/gi, (m, url) => {
                if (!url.startsWith('http')) return m;
                const proxiedUrl = videoProxyUrl + encodeURIComponent(url);
                return ` src="${proxiedUrl}"`;
            });

            // Replace poster attribute
            modifiedAttrs = modifiedAttrs.replace(/\sposter=["']([^"']+)["']/gi, (m, url) => {
                if (!url.startsWith('http')) return m;
                const proxiedUrl = videoProxyUrl + encodeURIComponent(url);
                return ` poster="${proxiedUrl}"`;
            });

            return `<video${modifiedAttrs}>`;
        });

        // Parse [fixsize] tags: [fixsize height X width Y Z] - skip entirely (layout data)
        parsed = parsed.replace(/\[fixsize[^\]]*\]/gi, '');

        // Parse [comment] tags: [comment ...]...[/comment] - skip entirely (metadata)
        parsed = parsed.replace(/\[comment[^\]]*\][\s\S]*?\[\/comment\]/gi, '');

        // Parse [style] tags: Remove [style] TAGS but keep inner TEXT (using shared utility)
        if (typeof Utils !== 'undefined' && Utils.removeStyleBlocks) {
            parsed = Utils.removeStyleBlocks(parsed);
        }

        // Parse emoticons first: [s:category:emoticon_name]
        parsed = parsed.replace(/\[s:([^:]+):([^\]]+)\]/g, (match, category, name) => {
            if (typeof getEmoticonUrl === 'function') {
                const emoticonUrl = getEmoticonUrl(name, category);
                if (emoticonUrl) {
                    return `<img src="${emoticonUrl}" alt="${this._escapeHtml(name)}" class="emoticon" loading="lazy" title="${this._escapeHtml(name)}">`;
                }
            }
            return match;
        });

        // Parse [img] tags: [img]URL[/img]
        parsed = parsed.replace(/\[img\]([^\[]+)\[\/img\]/gi, (match, url) => {
            const cleanUrl = url.trim();
            // Use CORS proxy for images
            const proxiedUrl = `https://wsrv.nl/?url=${encodeURIComponent(cleanUrl)}`;
            return `<img src="${proxiedUrl}" alt="Image" class="img-fluid post-image" loading="lazy">`;
        });

        // Parse [url] tags: [url=URL]text[/url] or [url]URL[/url]
        parsed = parsed.replace(/\[url=([^\]]+)\](.*?)\[\/url\]/gi, (match, url, text) => {
            return `<a href="${this._escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${text || url}</a>`;
        });
        parsed = parsed.replace(/\[url\]([^\[]+)\[\/url\]/gi, (match, url) => {
            return `<a href="${this._escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${url}</a>`;
        });

        // Parse [quote] blocks
        parsed = parsed.replace(/\[quote\]([\s\S]*?)\[\/quote\]/g, (match, quoteContent) => {
            return `<blockquote class="border-start border-3 border-secondary ps-3 my-2">${quoteContent}</blockquote>`;
        });

        // Parse formatting tags
        parsed = parsed.replace(/\[b\](.*?)\[\/b\]/gi, '<strong>$1</strong>');
        parsed = parsed.replace(/\[i\](.*?)\[\/i\]/gi, '<em>$1</em>');
        parsed = parsed.replace(/\[u\](.*?)\[\/u\]/gi, '<u>$1</u>');
        parsed = parsed.replace(/\[del\](.*?)\[\/del\]/gi, '<del>$1</del>');

        // Parse [color] tags
        parsed = parsed.replace(/\[color=([^\]]+)\](.*?)\[\/color\]/gi, (match, color, text) => {
            return `<span style="color: ${this._escapeHtml(color)}">${text}</span>`;
        });

        // Parse [size] tags
        parsed = parsed.replace(/\[size=([^\]]+)\](.*?)\[\/size\]/gi, (match, size, text) => {
            return `<span style="font-size: ${this._escapeHtml(size)}px">${text}</span>`;
        });

        // Parse line breaks
        parsed = parsed.replace(/<br\s*\/?>/gi, '<br>');

        return parsed;
    },

    _escapeHtml(text) {
        if (typeof Utils !== 'undefined' && Utils.escapeHtml) {
            return Utils.escapeHtml(text);
        }
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Make it globally available
window.BBCodeParser = BBCodeParser;
