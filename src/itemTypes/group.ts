/*
 | Copyright 2018 Esri
 |
 | Licensed under the Apache License, Version 2.0 (the "License");
 | you may not use this file except in compliance with the License.
 | You may obtain a copy of the License at
 |
 |    http://www.apache.org/licenses/LICENSE-2.0
 |
 | Unless required by applicable law or agreed to in writing, software
 | distributed under the License is distributed on an "AS IS" BASIS,
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 | See the License for the specific language governing permissions and
 | limitations under the License.
 */

import * as groups from "@esri/arcgis-rest-groups";
import { IPagingParamsRequestOptions } from "@esri/arcgis-rest-groups";
import { IUserRequestOptions } from "@esri/arcgis-rest-auth";

import { ITemplate } from "../interfaces";

// -- Exports -------------------------------------------------------------------------------------------------------//

/**
 * Gets the ids of the dependencies (contents) of an AGOL group.
 *
 * @param fullItem A group whose contents are sought
 * @param requestOptions Options for requesting information from AGOL
 * @return A promise that will resolve with list of dependent ids
 * @protected
 */
export function getDependencies (
  fullItem: ITemplate,
  requestOptions: IUserRequestOptions
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const pagingRequest:IPagingParamsRequestOptions = {
      paging: {
        start: 0,
        num: 100
      },
      ...requestOptions
    };

    // Fetch group items
    getGroupContentsTranche(fullItem.item.id, pagingRequest)
    .then(
      contents => resolve(contents),
      reject
    );
  });
}

// -- Internals ------------------------------------------------------------------------------------------------------//

/**
 * Gets the ids of a group's contents.
 *
 * @param id Group id
 * @param pagingRequest Options for requesting group contents; note: its paging.start parameter may
 *                      be modified by this routine
 * @return A promise that will resolve with a list of the ids of the group's contents
 * @protected
 */
export function getGroupContentsTranche (
  id: string,
  pagingRequest: IPagingParamsRequestOptions
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    // Fetch group items
    groups.getGroupContent(id, pagingRequest)
    .then(
      contents => {
        // Extract the list of content ids from the JSON returned
        const trancheIds:string[] = contents.items.map((item:any) => item.id);

        // Are there more contents to fetch?
        if (contents.nextStart > 0) {
          pagingRequest.paging.start = contents.nextStart;
          getGroupContentsTranche(id, pagingRequest)
          .then(
            (allSubsequentTrancheIds:string[]) => {
              // Append all of the following tranches to this tranche and return it
              Array.prototype.push.apply(trancheIds, allSubsequentTrancheIds);
              resolve(trancheIds);
            },
            reject
          );
        } else {
          resolve(trancheIds);
        }
      },
      error => {
        reject(error.originalMessage);
      }
    );
  });
}
