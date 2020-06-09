import * as common from "@esri/solution-common";
import * as featureLayer from "@esri/solution-feature-layer";
import * as file from "@esri/solution-file";
import * as formProcessor from "@esri/solution-form";
import * as group from "@esri/solution-group";
import {
  simpleTypes,
  notebookProcessor,
  quickcaptureProcessor
} from "@esri/solution-simple-types";

const UNSUPPORTED: common.moduleHandler = null;
import { HubSiteProcessor, HubPageProcessor } from "@esri/solution-hub-types";
import { StoryMapProcessor } from "@esri/solution-storymap";
import { WebExperienceProcessor } from "@esri/solution-web-experience";

/**
 * Mapping from item type to module with type-specific template-handling code.
 * AGO types come from a blend of arcgis-portal-app\src\js\arcgisonline\pages\item\_Info.js and
 * arcgis-portal-app\src\js\arcgis-components\src\_utils\metadata\item\displayName.ts
 */
export const moduleMap: common.IItemTypeModuleMap = {
  Group: group,

  ////////////////////////////////////////////////////////
  // Layer types
  "Big Data Analytic": undefined,
  "Feature Collection": undefined,
  "Feature Service": featureLayer,
  Feed: undefined,
  "Geocoding Service": undefined,
  "Geodata Service": undefined,
  "Geometry Service": undefined,
  "Geoprocessing Service": undefined,
  "Globe Service": undefined,
  "Image Service": undefined,
  KML: undefined,
  "Map Service": featureLayer,
  "Network Analysis Service": undefined,
  "Real Time Analytic": undefined,
  "Relational Database Connection": undefined,
  "Scene Service": undefined,
  "Stream Service": undefined,
  Tool: undefined,
  "Vector Tile Service": undefined,
  WFS: undefined,
  WMS: undefined,
  WMTS: undefined,
  "Workflow Manager Service": undefined,

  ////////////////////////////////////////////////////////
  // Map types
  "3D Web Scene": undefined,
  "Web Map": simpleTypes,
  "Web Scene": undefined,

  ////////////////////////////////////////////////////////
  // App types
  Application: undefined,
  Dashboard: simpleTypes,
  "Data Store": undefined,
  "Desktop Application": undefined,
  "Excalibur Imagery Project": undefined,
  Form: formProcessor,
  "Hub Initiative": UNSUPPORTED,
  "Hub Page": HubPageProcessor,
  "Hub Site Application": HubSiteProcessor,
  "Insights Model": undefined,
  "Insights Page": undefined,
  "Insights Theme": undefined,
  "Insights Workbook": undefined,
  Mission: undefined,
  "Mobile Application": undefined,
  Notebook: notebookProcessor,
  "Ortho Mapping Project": undefined,
  "QuickCapture Project": quickcaptureProcessor,
  "Site Application": HubSiteProcessor,
  "Site Initiative": UNSUPPORTED,
  "Site Page": HubPageProcessor,
  Solution: UNSUPPORTED,
  StoryMap: StoryMapProcessor,
  "Urban Model": undefined,
  "Web Experience Template": undefined,
  "Web Experience": WebExperienceProcessor,
  "Web Mapping Application": simpleTypes,
  "Workforce Project": simpleTypes,

  ////////////////////////////////////////////////////////
  // File types
  "360 VR Experience": file,
  "AppBuilder Extension": file,
  "AppBuilder Widget Package": file,
  "Application Configuration": file,
  "ArcGIS Pro Add In": file,
  "ArcGIS Pro Configuration": file,
  "ArcPad Package": file,
  "Basemap Package": file,
  "CAD Drawing": file,
  "CityEngine Web Scene": file,
  "Code Attachment": UNSUPPORTED,
  "Code Sample": file,
  "Color Set": file,
  "Compact Tile Package": file,
  "CSV Collection": file,
  CSV: file,
  "Deep Learning Package": file,
  "Desktop Add In": file,
  "Desktop Application Template": file,
  "Desktop Style": file,
  "Document Link": file,
  "Explorer Add In": file,
  "Explorer Layer": file,
  "Explorer Map": file,
  "Feature Collection Template": file,
  "File Geodatabase": file,
  GeoJson: file,
  GeoPackage: file,
  "Geoprocessing Package": file,
  "Geoprocessing Sample": file,
  "Globe Document": file,
  "Image Collection": file,
  Image: file,
  "iWork Keynote": file,
  "iWork Numbers": file,
  "iWork Pages": file,
  "KML Collection": file,
  "Layer Package": file,
  "Layer Template": file,
  Layer: file,
  Layout: file,
  "Locator Package": file,
  "Map Document": file,
  "Map Package": file,
  "Map Template": file,
  "Microsoft Excel": file,
  "Microsoft Powerpoint": file,
  "Microsoft Word": file,
  "Mobile Basemap Package": file,
  "Mobile Map Package": file,
  "Mobile Scene Package": file,
  "Native Application": file,
  "Native Application Installer": file,
  "Native Application Template": file,
  netCDF: file,
  "Operation View": file,
  "Operations Dashboard Add In": file,
  "Operations Dashboard Extension": file,
  PDF: file,
  "Pro Layer Package": file,
  "Pro Layer": file,
  "Pro Map Package": file,
  "Pro Map": file,
  "Pro Report": file,
  "Project Package": file,
  "Project Template": file,
  "Published Map": file,
  "Raster function template": file,
  "Report Template": file,
  "Rule Package": file,
  "Scene Document": file,
  "Scene Package": file,
  "Service Definition": file,
  Shapefile: file,
  "Statistical Data Collection": file,
  Style: file,
  "Survey123 Add In": file,
  "Symbol Set": file,
  "Task File": file,
  "Tile Package": file,
  "Toolbox Package": file,
  "Vector Tile Package": file,
  "Viewer Configuration": file,
  "Visio Document": file,
  "Window Mobile Package": file,
  "Windows Mobile Package": file,
  "Windows Viewer Add In": file,
  "Windows Viewer Configuration": file,
  "Workflow Manager Package": file,

  ////////////////////////////////////////////////////////
  // Testing "types"
  Undefined: undefined,
  Unsupported: UNSUPPORTED
};
