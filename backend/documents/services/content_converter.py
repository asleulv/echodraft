import json
import re


class ContentConverter:
    """Service for converting content between different formats."""
    
    @staticmethod
    def slate_to_html(content):
        """Convert Slate.js content to HTML."""
        if not content:
            return ""
        
        # Determine content type and convert
        if isinstance(content, (dict, list)) or (isinstance(content, str) and (content.startswith('[') or content.startswith('{'))):
            return ContentConverter._convert_slate_json(content)
        else:
            return ContentConverter._convert_markdown(content)
    
    @staticmethod
    def _convert_slate_json(content):
        """Convert Slate.js JSON to HTML."""
        try:
            if isinstance(content, str):
                parsed_content = json.loads(content)
            else:
                parsed_content = content
            
            html = []
            
            def process_node(node):
                if isinstance(node, dict):
                    if 'text' in node:
                        text = node['text']
                        if node.get('bold'):
                            text = f"<strong>{text}</strong>"
                        if node.get('italic'):
                            text = f"<em>{text}</em>"
                        if node.get('underline'):
                            text = f"<u>{text}</u>"
                        return text
                    
                    if 'children' in node:
                        children_html = ''.join(process_node(child) for child in node['children'])
                        node_type = node.get('type', 'paragraph')
                        
                        type_map = {
                            'paragraph': f"<p>{children_html}</p>",
                            'heading-one': f"<h1>{children_html}</h1>",
                            'heading-two': f"<h2>{children_html}</h2>",
                            'block-quote': f"<blockquote>{children_html}</blockquote>",
                            'bulleted-list': f"<ul>{children_html}</ul>",
                            'numbered-list': f"<ol>{children_html}</ol>",
                            'list-item': f"<li>{children_html}</li>",
                        }
                        
                        return type_map.get(node_type, children_html)
                    
                    return ''
                
                elif isinstance(node, list):
                    return ''.join(process_node(child) for child in node)
                
                return ''
            
            if isinstance(parsed_content, list):
                for node in parsed_content:
                    html.append(process_node(node))
            elif isinstance(parsed_content, dict):
                html.append(process_node(parsed_content))
            
            return ''.join(html)
        except:
            return ContentConverter._convert_markdown(content)
    
    @staticmethod
    def _convert_markdown(content):
        """Convert Markdown to HTML."""
        try:
            import markdown
            return markdown.markdown(
                content,
                extensions=['tables', 'fenced_code', 'codehilite', 'nl2br', 'sane_lists']
            )
        except ImportError:
            return ContentConverter._simple_markdown_conversion(content)
    
    @staticmethod
    def _simple_markdown_conversion(content):
        """Simple regex-based Markdown conversion."""
        html = content
        
        # Headers
        html = re.sub(r'^# (.+)$', r'<h1>\1</h1>', html, flags=re.MULTILINE)
        html = re.sub(r'^## (.+)$', r'<h2>\1</h2>', html, flags=re.MULTILINE)
        html = re.sub(r'^### (.+)$', r'<h3>\1</h3>', html, flags=re.MULTILINE)
        
        # Bold and italic
        html = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', html)
        html = re.sub(r'__(.+?)__', r'<strong>\1</strong>', html)
        html = re.sub(r'\*(.+?)\*', r'<em>\1</em>', html)
        html = re.sub(r'_(.+?)_', r'<em>\1</em>', html)
        
        # Links
        html = re.sub(r'\[(.+?)\]\((.+?)\)', r'<a href="\2">\1</a>', html)
        
        # Code
        html = re.sub(r'``````', r'<pre><code>\1</code></pre>', html, flags=re.DOTALL)
        html = re.sub(r'`(.+?)`', r'<code>\1</code>', html)
        
        # Paragraphs
        paragraphs = [p for p in html.split('\n\n') if p.strip()]
        html = ''.join([f'<p>{p}</p>' for p in paragraphs])
        
        return html
