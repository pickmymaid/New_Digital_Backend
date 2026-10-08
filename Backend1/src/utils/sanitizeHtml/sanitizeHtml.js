const sanitizeHtml = require('sanitize-html');

// Only what the rich-text editor (website job form + admin panel) can produce:
// basic formatting, two heading levels, lists, quote, code, links and tables.
// Anything else — scripts, event handlers, styles, iframes — is stripped.
const RICH_TEXT_OPTIONS = {
  allowedTags: [
    'p', 'br', 'div', 'span',
    'b', 'strong', 'i', 'em', 'u', 's', 'strike', 'del',
    'h1', 'h2',
    'ul', 'ol', 'li',
    'blockquote', 'pre', 'code',
    'a',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    th: ['colspan', 'rowspan'],
    td: ['colspan', 'rowspan'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { target: '_blank', rel: 'noopener noreferrer nofollow' }),
  },
};

const sanitizeRichText = (html) =>
  typeof html === 'string' ? sanitizeHtml(html, RICH_TEXT_OPTIONS) : html;

module.exports = { sanitizeRichText };
