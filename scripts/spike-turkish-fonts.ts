const pdfmake = require('pdfmake/build/pdfmake')
const vfsFonts = require('pdfmake/build/vfs_fonts')
const fs = require('fs')
const path = require('path')

// Add all Roboto fonts to pdfmake's vfs
Object.keys(vfsFonts).forEach(key => {
  pdfmake.virtualfs.storage[key] = Buffer.from(vfsFonts[key], 'base64')
})

// Also add our Arial fonts
const arialPath = path.join(process.env.WINDIR || 'C:\\Windows', 'Fonts', 'arial.ttf')
const arialBdPath = path.join(process.env.WINDIR || 'C:\\Windows', 'Fonts', 'arialbd.ttf')
pdfmake.virtualfs.storage['Arial-Regular.ttf'] = fs.readFileSync(arialPath)
pdfmake.virtualfs.storage['Arial-Bold.ttf'] = fs.readFileSync(arialBdPath)

// Use setFonts API with vfs paths
const fonts = {
  Arial: {
    normal: 'Arial-Regular.ttf',
    bold: 'Arial-Bold.ttf',
  },
  Roboto: pdfmake.fonts.Roboto
}

pdfmake.setFonts(fonts)

// Now create document with Arial
const doc = { 
  content: [
    { text: 'Değerlendirme: Şirket, ışık gören İstanbul\'daki çözümü önerdi.', font: 'Arial' },
    { text: 'ş ğ ü ö ç ı İ Ş Ğ Ü Ö Ç', font: 'Arial' },
  ], 
}

console.log('Creating PDF...')
const pdfDoc = pdfmake.createPdf(doc)
console.log('PDF doc created, waiting for buffer...')

pdfDoc.getBuffer().then(buffer => {
  console.log('buffer type:', typeof buffer)
  console.log('buffer length:', buffer.length)
  fs.writeFileSync('test-turkish-fonts.pdf', buffer)
  console.log('PDF saved!')
  process.exit(0)
}).catch(err => {
  console.error('err:', err.message)
  process.exit(1)
})