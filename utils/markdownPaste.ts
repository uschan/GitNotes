// @ts-ignore
import TurndownService from 'turndown';
// @ts-ignore
import { gfm } from 'turndown-plugin-gfm';

export const convertHtmlToMarkdown = (html: string): string => {
    try {
        // Robust Constructor Resolution
        let ServiceClass = TurndownService;
        // @ts-ignore
        if (typeof ServiceClass !== 'function' && ServiceClass.default) {
            // @ts-ignore
            ServiceClass = ServiceClass.default;
        }

        if (typeof ServiceClass !== 'function') {
            throw new Error("Could not find TurndownService constructor.");
        }

        // Initialize Service
        // @ts-ignore
        const turndownService = new ServiceClass({
            headingStyle: 'atx',
            codeBlockStyle: 'fenced',
            bulletListMarker: '-',
            emDelimiter: '*',
            hr: '***' // Use asterisks to avoid Frontmatter conflicts
        });

        // Plugin Loading
        try {
            if (typeof gfm === 'function') {
                turndownService.use(gfm);
            }
        } catch (pluginErr) {
            console.warn("GFM plugin failed", pluginErr);
        }

        // Pure Text Mode: Remove images
        turndownService.remove('img');
        turndownService.remove('picture');

        // Custom Rules
        turndownService.addRule('pre', {
            filter: ['pre'],
            replacement: function (content: string, node: any) {
                 return '\n```\n' + node.textContent + '\n```\n';
            }
        });

         // Force HR rule to be asterisks here too
         turndownService.addRule('horizontalRule', {
            filter: 'hr',
            replacement: function () {
                return '\n\n***\n\n';
            }
        });

        // Execute Conversion
        let markdown = turndownService.turndown(html);
        
        // --- DATA CLEANUP PIPELINE ---
        markdown = markdown.replace(/^\\(#+)/gm, '$1'); // \# -> #
        markdown = markdown.replace(/^\\>/gm, '>');     // \> -> >
        markdown = markdown.replace(/^\\([-*+])/gm, '$1'); // \- -> -
        markdown = markdown.replace(/^(\\\*){3,}$/gm, '***'); // \*\*\* -> ***
        markdown = markdown.replace(/\\([\[\]])/g, '$1');     // \[Link\] -> [Link]
        markdown = markdown.replace(/↩︎/g, ''); // Remove footnote returns
        markdown = markdown.replace(/\n{3,}/g, '\n\n'); // Normalize Whitespace

        return markdown;

    } catch (err) {
        console.error("Paste Conversion Error:", err);
        throw err;
    }
}