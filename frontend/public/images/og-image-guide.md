# Open Graph Image Guide for echodraft

## What is an Open Graph Image?

An Open Graph (OG) image is the image that appears when your website is shared on social media platforms like Facebook, Twitter, LinkedIn, and messaging apps like Slack or WhatsApp. It's a crucial element for making your shared links visually appealing and increasing click-through rates.

## Specifications for echodraft's OG Image

### Technical Requirements:
- **Dimensions**: 1200 × 630 pixels (optimal size for most platforms)
- **Format**: PNG or JPG (PNG preferred for graphics with text)
- **File size**: Keep under 1MB for faster loading
- **File name**: `og-image.png` (as referenced in the Layout.tsx meta tags)

### Design Recommendations:

#### Content Elements:
1. **Logo**: Include the echodraft logo prominently
2. **Tagline**: "Write it Once. Echo it Forever."
3. **Visual Representation**: Consider including a simplified version of your workflow diagram or a visual that represents content creation/replication
4. **Brand Colors**: Use your primary and secondary color palette

#### Design Tips:
1. **Keep it Simple**: Don't overcrowd the image with too much text or complex visuals
2. **High Contrast**: Ensure text is readable on the background
3. **Safe Zone**: Keep important elements away from the edges (some platforms may crop the image slightly)
4. **Mobile-Friendly**: The image will often be viewed on mobile devices, so make sure elements are visible at smaller sizes

## Example Layout:

```
┌────────────────────────────────────────────────────┐
│                                                    │
│   ┌─────────┐                                      │
│   │ LOGO    │                                      │
│   └─────────┘                                      │
│                                                    │
│   Write it Once. Echo it Forever.                  │
│                                                    │
│   [Simple visual representation of content         │
│    replication or AI-powered content creation]     │
│                                                    │
│                                                    │
│   AI-Powered Content Generation                    │
│                                                    │
└────────────────────────────────────────────────────┘
```

## Tools for Creating Your OG Image:

1. **Design Software**:
   - Adobe Photoshop or Illustrator
   - Figma (free option with powerful design capabilities)
   - Canva (user-friendly with templates)

2. **Online Tools**:
   - [Pablo by Buffer](https://pablo.buffer.com/)
   - [Canva Social Media Templates](https://www.canva.com/social-media-graphics/)

## Testing Your OG Image:

Before finalizing, test how your OG image appears when shared on different platforms using:
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)

## Implementation:

Once created, save the image as `og-image.png` in the `frontend/public/images/` directory to replace the placeholder text file.
