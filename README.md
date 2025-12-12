# Tesla Car Wrap Editor

A web-based editor for designing custom Tesla car wraps. This application allows users to upload images and text, arrange them on Tesla car templates, and download the final design as a PNG file.

## Features

- **Car Model Selection**: Choose from different Tesla models (Model 3, Model S, Model X, Model Y)
- **Image Upload**: Upload your own images to place on the car wrap
- **Text Editing**: Add and edit text elements
- **Transformation Tools**: Rotate, scale, and position elements
- **Masking System**: Only editable areas (white areas) of the template can be used
- **PNG Export**: Download your final design as a PNG file

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open your browser to `http://localhost:3000`

## Template Files

Template files should be placed in the `public/templates/` directory and follow the naming convention:
- `model3-template.png`
- `models-template.png`
- `modelx-template.png`
- `modely-template.png`

Templates should be UV unwrapping textures with black outlines and white interiors (editable areas).

## Technical Details

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Canvas Library**: Fabric.js for advanced canvas operations
- **Backend**: Node.js with Express for serving static files
- **File Handling**: Client-side only (no server uploads)

## Usage

1. Select a Tesla model from the dropdown
2. Click "Add Image" to upload an image or "Add Text" to add text
3. Position and transform your elements within the editable areas
4. Click "Download PNG" to save your design

## Future Enhancements

- Advanced transformation tools (skew, perspective)
- Layer management (reordering, visibility)
- Color adjustment tools
- Pre-made design templates
- Undo/redo functionality
- Multiple template support per model