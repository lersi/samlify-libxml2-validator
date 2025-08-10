import {Libxml, XmlError} from 'node-libxml'
import path from 'node:path'
import fs from 'node:fs'

const schemaDir = path.join(__dirname, 'schemas')
const schemas = fs.readdirSync(schemaDir, {recursive: false, encoding: 'utf-8'})
schemas.forEach((value, index) => schemas[index] = path.join(schemaDir, value))
const dtds = schemas.filter((value) => value.endsWith('.dtd'));
const xsds = schemas.filter((value) => value.endsWith('.xsd'));

const libxml = new Libxml()
libxml.loadDtds(dtds)
libxml.loadSchemas(xsds)
if (libxml.dtdsLoadedErrors || libxml.schemasLoadedErrors) {
    throw new Error('Failed to load DTDs or Schemas')
}

function printXmlErrors(errors: XmlError[]) {
    //@ts-ignore
    for (const error of errors) {
        console.error(`at ${error.line}:${error.column}, ${error.message} (${error.level})`)
    }
}

export const validate = function(xml: string) {
    return new Promise((resolve, reject) => {
        if(!libxml.loadXmlFromString(xml)) {
            const errors = libxml.wellformedErrors
            printXmlErrors(errors as XmlError[])
            libxml.freeXml()
            reject('ERR_EXCEPTION_VALIDATE_XML')
        } else if(!libxml.validateAgainstDtds()) {
            const errors = libxml.validationDtdErrors as Record<string, XmlError[]>
            printXmlErrors(Object.values(errors).flat(1))
            libxml.freeXml()
            reject('ERR_EXCEPTION_VALIDATE_XML')
        } else if(!libxml.validateAgainstSchemas()){
            const errors = libxml.validationSchemaErrors as Record<string, XmlError[]>
            printXmlErrors(Object.values(errors).flat(1))
            libxml.freeXml()
            reject('ERR_EXCEPTION_VALIDATE_XML')
        }
        libxml.freeXml()
        resolve('SUCCESS_VALIDATE_XML')
    })
}