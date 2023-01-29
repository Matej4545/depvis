import { PackageURL } from "packageurl-js";
import urlJoin from 'url-join';


const npmUrlBase = "https://www.npmjs.com/package/"
const nugetUrlBase = "https://www.nuget.org/packages/"
const pypiUrlBase = "https://pypi.org/project/"


export function GetComponentRepositoryURL(purl: string) {
    const component = PackageURL.fromString(purl)

    switch (component.type) {
        case "npm":
            return urlJoin(npmUrlBase, component.name, component.version ? urlJoin("v", component.version) : "")
        case "nuget":
            return urlJoin(nugetUrlBase, component.name, component.version)
        case "pypi":
            return urlJoin(pypiUrlBase, component.name, component.version)
        default:
            return urlJoin("https://www.google.com/search?q=", purl)
    }
}   