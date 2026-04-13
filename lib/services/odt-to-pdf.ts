import fs from 'fs'
import AdmZip from 'adm-zip'
import { DOMParser } from '@xmldom/xmldom'
import { buildPetitionDoc, generatePdfBuffer, htmlToPdfmakeContent } from '@/lib/pdf/pdf-generator'

export type VariableMap = Record<string, string>

export interface StyledText {
  text: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  fontSize?: number
}

export interface StyledBlock {
  type: 'paragraph' | 'heading' | 'list-item'
  level?: number
  content: StyledText[]
}

async function extractVariablesFromOdt(odtPath: string): Promise<string[]> {
  const zip = new AdmZip(odtPath)
  const contentXmlBuffer = zip.readFile('content.xml')
  if (!contentXmlBuffer) {
    return []
  }
  const contentXml = contentXmlBuffer.toString('utf-8')
  
  const variablePattern = /\{\{([^}]+)\}\}/g
  const matches = new Set<string>()
  let match
  
  while ((match = variablePattern.exec(contentXml)) !== null) {
    matches.add(match[1].trim())
  }
  
  return Array.from(matches)
}

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num)))
}

function getStyleFromAttributes(element: any): { bold?: boolean; italic?: boolean; underline?: boolean; fontSize?: number } {
  const result: { bold?: boolean; italic?: boolean; underline?: boolean; fontSize?: number } = {}
  
  const foFontWeight = element.getAttribute('fo:font-weight') || element.getAttribute('style:font-weight')
  if (foFontWeight) {
    if (foFontWeight === 'bold' || foFontWeight.includes('bold')) {
      result.bold = true
    }
  }
  
  const foFontStyle = element.getAttribute('fo:font-style') || element.getAttribute('style:font-style')
  if (foFontStyle) {
    if (foFontStyle === 'italic' || foFontStyle.includes('italic')) {
      result.italic = true
    }
  }
  
  const styleName = element.getAttribute('text:style-name') || element.getAttribute('style:name')
  if (styleName) {
    const name = styleName.toLowerCase()
    if (name.includes('bold') || name.includes('kalin') || name.includes('strong') || name.includes('bold')) {
      result.bold = true
    }
    if (name.includes('italic') || name.includes('egik') || name.includes('emphasized') || name.includes('oblique')) {
      result.italic = true
    }
    if (name.includes('underline') || name.includes('altcizgi')) {
      result.underline = true
    }
  }
  
  const foFontSize = element.getAttribute('fo:font-size') || element.getAttribute('style:font-size')
  if (foFontSize) {
    const match = foFontSize.match(/(\d+(\.\d+)?)/)
    if (match) {
      result.fontSize = parseFloat(match[1])
    }
  }
  
  return result
}

function extractStyledTextFromElement(element: any, inheritedStyle: { bold?: boolean; italic?: boolean; underline?: boolean } = {}): StyledText[] {
  const result: StyledText[] = []
  
  const childNodes = element.childNodes
  for (let i = 0; i < childNodes.length; i++) {
    const child = childNodes[i]
    if (child.nodeType === 3) {
      let text = child.textContent || ''
      text = text.replace(/\s+/g, ' ').trim()
      if (text) {
        result.push({
          text,
          ...inheritedStyle
        })
      }
    } else if (child.nodeType === 1) {
      const el = child as Element
      const tagName = el.tagName.toLowerCase()
      
      if (tagName === 'text:span') {
        const spanStyle = getStyleFromAttributes(el)
        const combinedStyle = { ...inheritedStyle, ...spanStyle }
        const spanContent = extractStyledTextFromElement(el, combinedStyle)
        result.push(...spanContent)
      } else if (tagName === 'text:s') {
        result.push({ text: ' ', ...inheritedStyle })
      } else if (tagName === 'text:tab') {
        result.push({ text: '\t', ...inheritedStyle })
      } else if (tagName === 'text:br') {
        result.push({ text: '\n', ...inheritedStyle })
      } else {
        const childContent = extractStyledTextFromElement(el, inheritedStyle)
        result.push(...childContent)
      }
    }
  }
  
  return result
}

function parseOdtXmlStyled(xmlContent: string): StyledBlock[] {
  const blocks: StyledBlock[] = []
  
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlContent, 'text/xml')
  
  const bodyContent = (doc.getElementsByTagName('office:body')[0] as any) || (doc.getElementsByTagName('office:text')[0] as any)
  if (!bodyContent) {
    return blocks
  }
  
  function processElement(element: any): void {
    const tagName = element.tagName.toLowerCase()
    
    if (tagName === 'text:h') {
      const levelStr = element.getAttribute('text:outline-level') || '1'
      const level = parseInt(levelStr, 10) || 1
      
      const content = extractStyledTextFromElement(element)
      if (content.length > 0) {
        blocks.push({
          type: 'heading',
          level,
          content
        })
      }
    } else if (tagName === 'text:p') {
      const content = extractStyledTextFromElement(element)
      if (content.length > 0) {
        blocks.push({
          type: 'paragraph',
          content
        })
      }
    } else if (tagName === 'text:list-item') {
      const content = extractStyledTextFromElement(element)
      if (content.length > 0) {
        blocks.push({
          type: 'list-item',
          content
        })
      }
    } else if (tagName === 'text:list') {
      const children = element.childNodes
      for (let i = 0; i < children.length; i++) {
        const child = children[i]
        if (child.nodeType === 1) {
          processElement(child as Element)
        }
      }
    }
    
    const children = element.childNodes
    for (let i = 0; i < children.length; i++) {
      const child = children[i]
      if (child.nodeType === 1 && tagName !== 'text:list') {
        processElement(child as Element)
      }
    }
  }
  
  processElement(bodyContent as any)
  
  return blocks
}

function applyVariablesToStyledBlocks(blocks: StyledBlock[], variables: VariableMap): StyledBlock[] {
  return blocks.map(block => ({
    ...block,
    content: block.content.map(span => ({
      ...span,
      text: substituteVariablesInSpan(span.text, variables)
    }))
  }))
}

function substituteVariablesInSpan(text: string, variables: VariableMap): string {
  let result = String(text || '')
  
  for (const [key, value] of Object.entries(variables)) {
    const pattern = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi')
    result = result.replace(pattern, String(value || ''))
  }
  
  return result
}

function substituteVariablesInText(text: string, variables: VariableMap): string {
  let result = String(text || '')
  
  for (const [key, value] of Object.entries(variables)) {
    const pattern = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi')
    result = result.replace(pattern, String(value || ''))
  }
  
  return result
}

export async function extractStyledContentFromOdt(
  odtPath: string,
  variables: VariableMap
): Promise<StyledBlock[]> {
  if (!fs.existsSync(odtPath)) {
    throw new Error(`ODT file not found: ${odtPath}`)
  }
  
  const zip = new AdmZip(odtPath)
  const contentXmlBuffer = zip.readFile('content.xml')
  if (!contentXmlBuffer) {
    throw new Error('Failed to read content.xml from ODT')
  }
  
  const contentXml = contentXmlBuffer.toString('utf-8')
  const blocks = parseOdtXmlStyled(contentXml)
  const withVariables = applyVariablesToStyledBlocks(blocks, variables)
  
  return withVariables
}

export async function extractTextFromOdt(odtPath: string, variables: VariableMap): Promise<string> {
  if (!fs.existsSync(odtPath)) {
    throw new Error(`ODT file not found: ${odtPath}`)
  }
  
  const zip = new AdmZip(odtPath)
  const contentXmlBuffer = zip.readFile('content.xml')
  if (!contentXmlBuffer) {
    throw new Error('Failed to read content.xml from ODT')
  }
  
  let contentXml = contentXmlBuffer.toString('utf-8')
  
  contentXml = contentXml.replace(/<text:span[^>]*>/g, '')
  contentXml = contentXml.replace(/<\/text:span>/g, '')
  contentXml = contentXml.replace(/<text:p[^>]*>/g, '\n\n')
  contentXml = contentXml.replace(/<\/text:p>/g, '')
  contentXml = contentXml.replace(/<text:h[^>]*>/g, '\n\n')
  contentXml = contentXml.replace(/<\/text:h>/g, '')
  contentXml = contentXml.replace(/<text:list-item>/g, '\n• ')
  contentXml = contentXml.replace(/<\/text:list-item>/g, '')
  contentXml = contentXml.replace(/<text:s\/>/g, ' ')
  contentXml = contentXml.replace(/<text:tab\/>/g, '\t')
  contentXml = contentXml.replace(/<[^>]+>/g, '')
  
  let text = decodeXmlEntities(contentXml)
  text = substituteVariablesInText(text, variables)
  
  text = text.replace(/\n{3,}/g, '\n\n')
  text = text.trim()
  
  return text
}

export function substituteVariables(text: string, variables: VariableMap): string {
  return substituteVariablesInText(text, variables)
}

export async function processOdtTemplate(
  odtPath: string,
  variables: VariableMap
): Promise<Buffer> {
  if (!fs.existsSync(odtPath)) {
    throw new Error(`ODT file not found: ${odtPath}`)
  }
  
  const zip = new AdmZip(odtPath)
  const contentXmlBuffer = zip.readFile('content.xml')
  if (!contentXmlBuffer) {
    throw new Error('Failed to read content.xml from ODT')
  }
  
  let text = contentXmlBuffer.toString('utf-8')
  text = text.replace(/<text:span[^>]*>/g, '')
  text = text.replace(/<\/text:span>/g, '')
  text = text.replace(/<text:p[^>]*>/g, '\n\n')
  text = text.replace(/<\/text:p>/g, '')
  text = text.replace(/<text:h[^>]*>/g, '\n\n')
  text = text.replace(/<\/text:h>/g, '')
  text = text.replace(/<text:list-item>/g, '\n• ')
  text = text.replace(/<\/text:list-item>/g, '')
  text = text.replace(/<[^>]+>/g, '')
  
  let decoded = decodeXmlEntities(text)
  decoded = substituteVariablesInText(decoded, variables)
  
  decoded = decoded.replace(/\n{3,}/g, '\n\n')
  decoded = decoded.trim()
  
  const docDefinition = buildPetitionDoc(decoded)
  const pdfBuffer = await generatePdfBuffer(docDefinition)
  
  return pdfBuffer
}

export { extractVariablesFromOdt }
