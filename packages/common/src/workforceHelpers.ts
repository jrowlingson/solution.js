/** @license
 * Copyright 2020 Esri
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Provides general helper functions.
 *
 * @module featureServiceHelpers
 */

import { templatizeTerm } from "./templatization";
import { rest_queryFeatures, rest_addFeatures } from "./featureServiceHelpers";
import {
  IItemTemplate,
  IFeatureServiceProperties,
  UserSession
} from "./interfaces";
import { getProp, fail } from "./generalHelpers";
import { rest_request } from "./restHelpers";

///////////////////////////////////////////////////////////////////////
// Workforce V1 specific logic

/**
 * Converts an workforce item to a template.
 *
 * @param itemTemplate template for the workforce project item
 * @param authentication credentials for any requests
 * @return templatized itemTemplate
 */
export function convertWorkforceItemToTemplate(
  itemTemplate: IItemTemplate,
  authentication: UserSession
): Promise<IItemTemplate> {
  return new Promise<IItemTemplate>((resolve, reject) => {
    // Key properties that contain item IDs for the workforce project type
    const keyProperties: string[] = [
      "groupId",
      "workerWebMapId",
      "dispatcherWebMapId",
      "dispatchers",
      "assignments",
      "workers",
      "tracks"
    ];

    // The templates data to process
    const data: any = itemTemplate.data;

    if (data) {
      // Extract dependencies
      extractWorkforceDependencies(data, keyProperties, authentication).then(
        results => {
          itemTemplate.dependencies = results.dependencies;
          // templatize key properties
          itemTemplate.data = templatizeWorkforce(
            data,
            keyProperties,
            results.urlHash
          );
          resolve(itemTemplate);
        },
        e => reject(fail(e))
      );
    } else {
      resolve(itemTemplate);
    }
  });
}

/**
 * Gets the ids of the dependencies of the workforce project.
 *
 * @param data itemTemplate data
 * @param keyProperties workforce project properties that contain references to dependencies
 * @param authentication credentials for any requests
 * @return List of dependencies ids
 */
export function extractWorkforceDependencies(
  data: any,
  keyProperties: string[],
  authentication: UserSession
): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    const deps: string[] = [];

    // get the ids for the service dependencies
    // "workerWebMapId" and "dispatcherWebMapId" are already IDs and don't have a serviceItemId
    keyProperties.forEach(p => {
      const serviceItemId: string = getProp(data, p + ".serviceItemId");
      const v: string = getProp(data, p);
      if (serviceItemId) {
        if (deps.indexOf(serviceItemId) === -1) {
          deps.push(serviceItemId);
        }
      } else {
        idTest(v, deps);
      }
    });

    if (getProp(data, "assignmentIntegrations")) {
      let requests: Array<Promise<any>> = [];
      let urls: string[] = [];
      data.assignmentIntegrations.forEach((ai: any) => {
        if (ai.assignmentTypes) {
          const assignmentKeys: string[] = Object.keys(ai.assignmentTypes);
          assignmentKeys.forEach(k => {
            const urlTemplate: any = ai.assignmentTypes[k].urlTemplate;
            idTest(urlTemplate, deps);
            const serviceRequests: any = urlTest(urlTemplate, authentication);
            if (
              Array.isArray(serviceRequests.requests) &&
              serviceRequests.requests.length > 0
            ) {
              requests = requests.concat(serviceRequests.requests);
              urls = urls.concat(serviceRequests.urls);
            }
          });
        }
      });

      if (requests.length > 0) {
        Promise.all(requests).then(
          results => {
            const urlHash: any = {};
            // Get the serviceItemId for the url
            /* istanbul ignore else */
            if (Array.isArray(results)) {
              results.forEach((result, i) => {
                /* istanbul ignore else */
                if (result.serviceItemId) {
                  urlHash[urls[i]] = result.serviceItemId;
                  /* istanbul ignore else */
                  if (deps.indexOf(result.serviceItemId) === -1) {
                    deps.push(result.serviceItemId);
                  }
                }
              });
            }
            resolve({
              dependencies: deps,
              urlHash: urlHash
            });
          },
          e => reject(fail(e))
        );
      } else {
        resolve({
          dependencies: deps,
          urlHash: {}
        });
      }
    } else {
      resolve({
        dependencies: deps,
        urlHash: {}
      });
    }
  });
}

/**
 * Updates a list of the items dependencies if more are found in the
 * provided value.
 *
 * @param v a string value to check for ids
 * @param deps a list of the items dependencies
 */
export function idTest(v: any, deps: string[]): void {
  const ids: any[] = _getIDs(v);
  ids.forEach(id => {
    /* istanbul ignore else */
    if (deps.indexOf(id) === -1) {
      deps.push(id);
    }
  });
}

/**
 * Templatizes key item properties.
 *
 * @param data itemTemplate data
 * @param keyProperties workforce project properties that should be templatized
 * @param urlHash a key value pair of url and itemId
 * @return an updated data object to be stored in the template
 */
export function templatizeWorkforce(
  data: any,
  keyProperties: string[],
  urlHash: any
): any {
  keyProperties.forEach(p => {
    /* istanbul ignore else */
    if (getProp(data, p)) {
      if (getProp(data[p], "serviceItemId")) {
        // templatize properties with id and url
        const id: string = data[p].serviceItemId;
        let serviceItemIdSuffix: string = ".itemId";

        /* istanbul ignore else */
        if (getProp(data[p], "url")) {
          const layerId = getLayerId(data[p].url);
          data[p].url = templatizeTerm(
            id,
            id,
            getReplaceValue(layerId, ".url")
          );
          serviceItemIdSuffix = getReplaceValue(layerId, serviceItemIdSuffix);
        }
        data[p].serviceItemId = templatizeTerm(id, id, serviceItemIdSuffix);
      } else {
        // templatize simple id properties
        data[p] = templatizeTerm(data[p], data[p], ".itemId");
      }
    }
  });

  data["folderId"] = "{{folderId}}";

  // templatize app integrations
  const integrations: any[] = data.assignmentIntegrations || [];
  integrations.forEach(i => {
    _templatizeUrlTemplate(i, urlHash);
    /* istanbul ignore else */
    if (i.assignmentTypes) {
      const assignmentKeys: string[] = Object.keys(i.assignmentTypes);
      assignmentKeys.forEach(k => {
        _templatizeUrlTemplate(i.assignmentTypes[k], urlHash);
      });
    }
  });
  return data;
}

///////////////////////////////////////////////////////////////////////

export function getWorkforceDependencies(
  itemTemplate: IItemTemplate,
  dependencies: any[]
): any {
  // if workforce v2 then we need to do some stuff
  const properties: any = itemTemplate.item.properties || {};
  const keyProperties: string[] = getKeyWorkforceProperties();
  dependencies = keyProperties.reduce(function(acc, v) {
    if (properties[v]) {
      acc.push(properties[v]);
    }
    return acc;
  }, []);

  // We also need the dependencies listed in the Assignment Integrations table
  const infos: any = getProp(
    itemTemplate,
    "properties.workforceInfos.assignmentIntegrationInfos"
  );
  if (infos && infos.length > 0) {
    infos.forEach((info: any) => {
      const infoKeys = Object.keys(info);
      if (infoKeys.indexOf("dependencies") > -1) {
        info["dependencies"].forEach((d: string) => {
          if (dependencies.indexOf(d) < 0) {
            dependencies.push(d);
          }
        });
      }
    });
  }

  return dependencies.map(d => {
    return { id: d, name: "" };
  });
}

export function getWorkforceServiceInfo(
  properties: IFeatureServiceProperties,
  url: string,
  authentication: UserSession
): Promise<IFeatureServiceProperties> {
  return new Promise<IFeatureServiceProperties>((resolve, reject) => {
    url = url.replace("/rest/admin/services", "/rest/services");
    const requests: any[] = [
      rest_queryFeatures({
        url: `${url}/3`,
        where: "1=1",
        authentication
      }),
      rest_queryFeatures({
        url: `${url}/4`,
        where: "1=1",
        authentication
      })
    ];

    Promise.all(requests).then(
      responses => {
        const [assignmentTypes, assignmentIntegrations] = responses;

        properties.workforceInfos = {
          assignmentTypeInfos: _getAssignmentTypeInfos(assignmentTypes)
        };

        _getAssignmentIntegrationInfos(
          assignmentIntegrations,
          authentication
        ).then(
          results => {
            properties.workforceInfos["assignmentIntegrationInfos"] = results;
            resolve(properties);
          },
          e => reject(fail(e))
        );
      },
      e => reject(fail(e))
    );
  });
}

export function _getAssignmentTypeInfos(assignmentTypes: any): any[] {
  // Assignment Types
  const assignmentTypeInfos: any[] = [];
  const keyAssignmentTypeProps = [
    "description",
    assignmentTypes.globalIdFieldName
  ];
  assignmentTypes.features.forEach((f: any) => {
    const info = {};
    keyAssignmentTypeProps.forEach(p => {
      info[p] = f.attributes[p];
    });
    assignmentTypeInfos.push(info);
  });
  return assignmentTypeInfos;
}

export function _getAssignmentIntegrationInfos(
  assignmentIntegrations: any,
  authentication: UserSession
): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    let requests: Array<Promise<any>> = [];
    let urls: string[] = [];
    const assignmentIntegrationInfos: any[] = [];
    const keyAssignmentIntegrationsProps = [
      "appid",
      assignmentIntegrations.globalIdFieldName,
      "prompt",
      "urltemplate",
      "assignmenttype"
    ];
    assignmentIntegrations.features.forEach((f: any) => {
      const info = {};
      keyAssignmentIntegrationsProps.forEach(p => {
        info[p] = f.attributes[p];
        if (p === "urltemplate") {
          const urlTemplate = f.attributes[p];
          const ids: string[] = _getIDs(urlTemplate);
          info["dependencies"] = ids;
          ////////////////////////////////////////////////////
          // from workforce
          const serviceRequests: any = urlTest(urlTemplate, authentication);
          if (
            Array.isArray(serviceRequests.requests) &&
            serviceRequests.requests.length > 0
          ) {
            requests = requests.concat(serviceRequests.requests);
            urls = urls.concat(serviceRequests.urls);
          }
          ////////////////////////////////////////////////////
        }
      });
      assignmentIntegrationInfos.push(info);
    });

    getUrlDependencies(requests, urls).then(
      results => {
        assignmentIntegrationInfos.forEach(ai => {
          _templatizeUrlTemplate(ai, results.urlHash);
        });

        resolve(assignmentIntegrationInfos);
      },
      e => reject(fail(e))
    );
  });
}

export function getUrlDependencies(
  requests: Array<Promise<any>>,
  urls: string[]
): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    const dependencies: any[] = [];
    if (requests.length > 0) {
      Promise.all(requests).then(
        results => {
          const urlHash: any = {};
          // Get the serviceItemId for the url
          /* istanbul ignore else */
          if (Array.isArray(results)) {
            results.forEach((result, i) => {
              /* istanbul ignore else */
              if (result.serviceItemId) {
                urlHash[urls[i]] = result.serviceItemId;
                /* istanbul ignore else */
                if (dependencies.indexOf(result.serviceItemId) === -1) {
                  dependencies.push(result.serviceItemId);
                }
              }
            });
          }
          resolve({
            dependencies,
            urlHash
          });
        },
        e => reject(fail(e))
      );
    } else {
      resolve({
        dependencies,
        urlHash: {}
      });
    }
  });
}

/**
 * Templatizes values from a urlTemplate
 *
 * @param item the object that may contain a urlTemplate
 * @param urlHash a key value pair of url and itemId
 */
export function _templatizeUrlTemplate(item: any, urlHash: any): void {
  /* istanbul ignore else */
  if (getProp(item, "urltemplate")) {
    const ids: string[] = _getIDs(item.urltemplate);
    ids.forEach(id => {
      item.urltemplate = item.urltemplate.replace(
        id,
        templatizeTerm(id, id, ".itemId")
      );
    });
    const urls: string[] = _getURLs(item.urltemplate);
    urls.forEach(url => {
      const layerId = getLayerId(url);
      const replaceValue: string = getReplaceValue(layerId, ".url");
      item.urltemplate = item.urltemplate.replace(
        url,
        templatizeTerm(urlHash[url], urlHash[url], replaceValue)
      );
    });
  }
}

export function getLayerId(url: string): any {
  return url.indexOf("FeatureServer/") > -1
    ? url.substr(url.lastIndexOf("/") + 1)
    : undefined;
}

export function getReplaceValue(layerId: any, suffix: string): string {
  return isNaN(Number.parseInt(layerId, 10))
    ? `${suffix}`
    : `.layer${layerId}${suffix}`;
}

export function postProcessWorkforceTemplates(
  templates: IItemTemplate[]
): IItemTemplate[] {
  const groupUpdates: any = {};
  const _templates = templates.map(t => {
    // templatize Workforce Project
    t = _templatizeWorkforceProject(t, groupUpdates);

    // templatize Workforce Dispatcher
    t = _templatizeWorkforceDispatcherOrWorker(t, "Workforce Dispatcher");

    // templatize Workforce Worker
    t = _templatizeWorkforceDispatcherOrWorker(t, "Workforce Worker");

    return t;
  });

  return _templates.map(t => {
    if (groupUpdates[t.itemId]) {
      t.dependencies = t.dependencies.concat(groupUpdates[t.itemId]);
    }
    return t;
  });
}

export function _templatizeWorkforceProject(
  t: IItemTemplate,
  groupUpdates: any
): any {
  if ((t.item.typeKeywords || []).indexOf("Workforce Project") > -1) {
    const properties: any = t.item.properties || {};
    const keyProperties: string[] = getKeyWorkforceProperties();

    const groupId: string = properties["workforceProjectGroupId"];
    const shuffleIds: string[] = [];
    Object.keys(properties).forEach((p: any) => {
      if (keyProperties.indexOf(p) > -1) {
        const id: string = properties[p];
        if (id !== groupId) {
          shuffleIds.push(id);
        }
        t.item.properties[p] = templatizeTerm(
          properties[p],
          properties[p],
          ".itemId"
        );
      }
    });

    // update the dependencies
    t.dependencies = t.dependencies.filter(
      (d: string) => d !== groupId && shuffleIds.indexOf(d) < 0
    );

    // shuffle and cleanup
    const workforceInfos = getProp(t, "properties.workforceInfos");
    if (workforceInfos) {
      Object.keys(workforceInfos).forEach(k => {
        workforceInfos[k].forEach((wInfo: any) => {
          if (wInfo.dependencies) {
            wInfo.dependencies.forEach((id: string) => {
              if (shuffleIds.indexOf(id) < 0) {
                shuffleIds.push(id);
              }
              const depIndex = t.dependencies.indexOf(id);
              if (depIndex > -1) {
                t.dependencies.splice(depIndex, 1);
              }
            });
            delete wInfo.dependencies;
          }
        });
      });
    }

    // move the dependencies to the group
    groupUpdates[groupId] = shuffleIds;
  }
  return t;
}

export function _templatizeWorkforceDispatcherOrWorker(
  t: IItemTemplate,
  type: string
): IItemTemplate {
  if ((t.item.typeKeywords || []).indexOf(type) > -1) {
    const properties: any = t.item.properties || {};
    const fsId = properties["workforceFeatureServiceId"];
    if (fsId) {
      t.item.properties["workforceFeatureServiceId"] = templatizeTerm(
        fsId,
        fsId,
        ".itemId"
      );
    }
  }
  return t;
}

// Helpers
export function isWorkforceProject(itemTemplate: IItemTemplate): boolean {
  return (
    (itemTemplate.item.typeKeywords || []).indexOf("Workforce Project") > -1
  );
}

export function getKeyWorkforceProperties(): string[] {
  return [
    "workforceDispatcherMapId",
    "workforceProjectGroupId",
    "workforceWorkerMapId"
  ];
}

export function _getIDs(v: string): string[] {
  // avoid IDs that are in a FS url as part of service name
  // Only get IDs that are proceeded by '=' but do not return the '='
  return regExTest(v, /=[0-9A-F]{32}/gi).map(_v => _v.replace("=", ""));
}

/**
 * Evaluates a value with a regular expression
 *
 * @param v a string value to test with the expression
 * @param ex the regular expresion to test with
 * @return an array of matches
 */
export function regExTest(v: any, ex: RegExp): any[] {
  return v && ex.test(v) ? v.match(ex) : [];
}

/**
 * Test the provided value for any urls and submit a request to obtain the service item id for the url
 *
 * @param v a string value to test for urls
 * @param authentication credentials for the requests
 * @returns an object with any pending requests and the urls that requests were made to
 */
export function urlTest(v: any, authentication: UserSession): any {
  const urls: any[] = _getURLs(v);
  const requests: Array<Promise<any>> = [];
  urls.forEach(url => {
    const options: any = {
      f: "json",
      authentication: authentication
    };
    requests.push(rest_request(url, options));
  });
  return {
    requests: requests,
    urls: urls
  };
}

export function _getURLs(v: string): string[] {
  return regExTest(v, /=(http.*?FeatureServer.*?(?=&|$))/gi).map(_v =>
    _v.replace("=", "")
  );
}

//#region Deploy Process ---------------------------------------------------------------------------------------//

/**
 * Gets the current user and updates the dispatchers service
 *
 * @param newlyCreatedItem Item to be created; n.b.: this item is modified
 * @param destinationAuthentication The session used to create the new item(s)
 * @return A promise that will resolve with { "success" === true || false }
 */
export function fineTuneCreatedWorkforceItem(
  newlyCreatedItem: IItemTemplate,
  destinationAuthentication: UserSession,
  workforceVersion: number
): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    destinationAuthentication.getUser().then(
      user => {
        if (workforceVersion === 1) {
          _updateDispatchers(
            getProp(newlyCreatedItem, "data.dispatchers"),
            user.username || "",
            user.fullName || "",
            destinationAuthentication
          ).then(
            results => {
              resolve({ success: results });
            },
            e => reject(fail(e))
          );
        } else {
          // TODO V2 updates go here
          resolve({ success: false });
        }
      },
      e => reject(fail(e))
    );
  });
}

/**
 * Updates the dispatchers service to include the current user as a dispatcher
 *
 * @param dispatchers The dispatchers object from the workforce items data
 * @param name Current users name
 * @param fullName Current users full name
 * @param destinationAuthentication The session used to create the new item(s)
 * @return A promise that will resolve with true || false
 * @protected
 */
export function _updateDispatchers(
  dispatchers: any,
  name: string,
  fullName: string,
  destinationAuthentication: UserSession
): Promise<boolean> {
  return new Promise<boolean>((resolve, reject) => {
    if (dispatchers && dispatchers.url) {
      rest_queryFeatures({
        url: dispatchers.url,
        where: "userId = '" + name + "'",
        authentication: destinationAuthentication
      }).then(
        (results: any) => {
          if (results && results.features) {
            if (results.features.length === 0) {
              rest_addFeatures({
                url: dispatchers.url,
                features: [
                  {
                    attributes: {
                      name: fullName,
                      userId: name
                    }
                  }
                ],
                authentication: destinationAuthentication
              }).then(
                addResults => {
                  if (addResults && addResults.addResults) {
                    resolve(true);
                  } else {
                    reject(
                      fail({
                        success: false,
                        message: "Failed to add dispatch record."
                      })
                    );
                  }
                },
                e =>
                  reject(
                    fail({
                      success: false,
                      message: "Failed to add dispatch record.",
                      error: e
                    })
                  )
              );
            } else {
              resolve(true);
            }
          } else {
            resolve(false);
          }
        },
        e => reject(fail(e))
      );
    } else {
      resolve(false);
    }
  });
}

//#endregion
