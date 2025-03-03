/** @license
 * Copyright 2024 Esri
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
 * Provides tests for the creation and deployment of item types that contain files.
 */

import * as WebToolProcessor from "../src/web-tool-processor";
import * as utils from "../../common/test/mocks/utils";
import * as common from "@esri/solution-common";
import { simpleTypes } from "@esri/solution-simple-types";
import * as request from "@esri/arcgis-rest-request";
import * as portalModule from "@esri/arcgis-rest-portal";

let MOCK_USER_SESSION: common.UserSession;

beforeEach(() => {
  MOCK_USER_SESSION = utils.createRuntimeMockUserSession();
});

// ------------------------------------------------------------------------------------------------------------------ //

describe("Module `web-tool-processor`: ", () => {
  describe("convertItemToTemplate :: ", () => {
    it("should delegate to simple types convertToTemplate", () => {
      const tpl = {
        id: "bc3",
        type: "Geoprocessing Service",
        item: {
          typeKeywords: ["Web Tool"],
          id: "",
          type: ""
        },
        itemId: "",
        key: "",
        data: {},
        resources: [],
        dependencies: [],
        properties: {},
        groups: [],
        estimatedDeploymentCostFactor: 0
      }
      const convertSpy = spyOn(
        simpleTypes,
        "convertItemToTemplate"
      ).and.resolveTo(tpl);

      return WebToolProcessor.convertItemToTemplate(
        { id: "bc3",
          type: "Geoprocessing Service",
          item: { typeKeywords: ["Web Tool"] }
         },
        MOCK_USER_SESSION,
        MOCK_USER_SESSION,
        {}
      ).then(() => {
        expect(convertSpy.calls.count()).toBe(
          1,
          "delegate to simple types"
        );
      });
    });
  });

  describe("createItemFromTemplate", () => {
    it("it exists", () => {
      expect(WebToolProcessor.createItemFromTemplate).toBeDefined(
        "Should have createItemFromTemplate method"
      );
    });

    const tmpl = {
      itemId: "bc8",
      type: "Geoprocessing Service",
      item: {}
    } as common.IItemTemplate;
    const td = {
      organization: {
        id: "somePortalId",
        portalHostname: "www.arcgis.com"
      },
      user: {
        username: "vader"
      },
      solutionItemExtent: "10,10,20,20",
      solution: {
        title: "Some Title"
      }
    };
    const cb = () => true;

    it("early-exits correctly", () => {
      const cbFalse = () => false;
      return WebToolProcessor.createItemFromTemplate(
        tmpl,
        td,
        MOCK_USER_SESSION,
        cbFalse
      ).then(result => {
        expect(result.id).toBe("", "should return empty result");
        expect(result.postProcess).toBe(
          false,
          "should return postProcess false"
        );
      });
    });

    it("can create Web Tool Geoprocessing Service", done => {
      const createRequestSpy1 = spyOn(
        request,
        "request"
      ).and.resolveTo({
        itemId: "newgs0123456789"
      });
      WebToolProcessor.createItemFromTemplate(
        {
          id: "bc3",
          type: "Geoprocessing Service",
          item: {
            typeKeywords: ["Web Tool"],
            thumbnail: "thumb"
          },
          data: {
            notebookId: "123",
            name: "NotebookName"
          }
        } as any,
        {
          portalUrls: {
            notebooks: {
              https: [
                "notebookservice"
              ]
            }
          }
        },
        MOCK_USER_SESSION,
        cb
      ).then(result => {
        expect(createRequestSpy1.calls.count()).toBe(3);
        expect(result.item?.data).toEqual({});
        done();
      });
    });

    it("Web Tool Geoprocessing Service handles cancel", done => {
      const createCb2 = () => {
        let calls = 0;
        return () => {
          calls = calls + 1;
          return calls < 2;
        };
      };
      const createRequestSpy2 = spyOn(
        request,
        "request"
      ).and.resolveTo({
        itemId: "newgs0123456789"
      });
      WebToolProcessor.createItemFromTemplate(
        {
          id: "bc3",
          type: "Geoprocessing Service",
          item: {
            typeKeywords: ["Web Tool"],
            thumbnail: "thumb"
          },
          data: {
            notebookId: "123",
            name: "NotebookName"
          }
        } as any,
        {
          portalUrls: {
            notebooks: {
              https: [
                "notebookservice"
              ]
            }
          }
        },
        MOCK_USER_SESSION,
        createCb2()
      ).then(() => {
        expect(createRequestSpy2.calls.count()).toBe(2);
        done();
      });
    });

    it("Web Tool Geoprocessing Service handles cancel and item removal", done => {
      const createCb2 = () => {
        let calls = 0;
        return () => {
          calls = calls + 1;
          return calls < 2;
        };
      };
      const createRequestSpy2 = spyOn(
        request,
        "request"
      ).and.resolveTo({
        itemId: "newgs0123456789"
      });
      const removeSpy = spyOn(portalModule, "removeItem").and.resolveTo({
        success: true,
        itemId: "3ef"
      });
      WebToolProcessor.createItemFromTemplate(
        {
          id: "bc3",
          type: "Geoprocessing Service",
          item: {
            typeKeywords: ["Web Tool"],
            thumbnail: "thumb"
          },
          data: {
            notebookId: "123",
            name: "NotebookName"
          }
        } as any,
        {
          portalUrls: {
            notebooks: {
              https: [
                "notebookservice"
              ]
            }
          }
        },
        MOCK_USER_SESSION,
        createCb2()
      ).then(() => {
        expect(createRequestSpy2.calls.count()).toBe(1);
        expect(removeSpy.calls.count()).toBe(1);
        done();
      });
    });

    it("handles cancel during updateItemExtended", done => {
      const createCb2 = () => {
        let calls = 0;
        return () => {
          calls = calls + 1;
          return calls < 3;
        };
      };
      const createRequestSpy2 = spyOn(
        request,
        "request"
      ).and.resolveTo({
        itemId: "newgs0123456789"
      });
      WebToolProcessor.createItemFromTemplate(
        {
          id: "bc3",
          type: "Geoprocessing Service",
          item: {
            typeKeywords: ["Web Tool"],
            thumbnail: "thumb"
          },
          data: {
            notebookId: "123",
            name: "NotebookName"
          }
        } as any,
        {
          portalUrls: {
            notebooks: {
              https: [
                "notebookservice"
              ]
            }
          }
        },
        MOCK_USER_SESSION,
        createCb2()
      ).then(() => {
        expect(createRequestSpy2.calls.count()).toBe(3);
        done();
      });
    });

    it("handles cancel during updateItemExtended and removes item", done => {
      const createCb2 = () => {
        let calls = 0;
        return () => {
          calls = calls + 1;
          return calls < 3;
        };
      };
      const createRequestSpy2 = spyOn(
        request,
        "request"
      ).and.resolveTo({
        itemId: "newgs0123456789"
      });
      const removeSpy = spyOn(portalModule, "removeItem").and.resolveTo({
        success: true,
        itemId: "3ef"
      });
      WebToolProcessor.createItemFromTemplate(
        {
          id: "bc3",
          type: "Geoprocessing Service",
          item: {
            typeKeywords: ["Web Tool"],
            thumbnail: "thumb"
          },
          data: {
            notebookId: "123",
            name: "NotebookName"
          }
        } as any,
        {
          portalUrls: {
            notebooks: {
              https: [
                "notebookservice"
              ]
            }
          }
        },
        MOCK_USER_SESSION,
        createCb2()
      ).then(() => {
        expect(createRequestSpy2.calls.count()).toBe(2);
        expect(removeSpy.calls.count()).toBe(1);
        done();
      });
    });

    it("handles reject during updateItemExtended and removes item", done => {
      const createCb2 = () => {
        let calls = 0;
        return () => {
          calls = calls + 1;
          return calls < 3;
        };
      };
      const createRequestSpy2 = spyOn(
        request,
        "request"
      ).and.resolveTo({
        itemId: "newgs0123456789"
      });
      const updateItemRejectSpy = spyOn(
        common,
        "updateItemExtended"
      ).and.rejectWith("error");
      const removeSpy = spyOn(portalModule, "removeItem").and.resolveTo({
        success: true,
        itemId: "3ef"
      });
      WebToolProcessor.createItemFromTemplate(
        {
          id: "bc3",
          type: "Geoprocessing Service",
          item: {
            typeKeywords: ["Web Tool"],
            thumbnail: "thumb"
          },
          data: {
            notebookId: "123",
            name: "NotebookName"
          }
        } as any,
        {
          portalUrls: {
            notebooks: {
              https: [
                "notebookservice"
              ]
            }
          }
        },
        MOCK_USER_SESSION,
        createCb2()
      ).then(() => {
        expect(createRequestSpy2.calls.count()).toBe(1);
        expect(updateItemRejectSpy.calls.count()).toBe(1);
        expect(removeSpy.calls.count()).toBe(1);
        done();
      });
    });

    it("handles reject during updateItemExtended and reject during remove item", done => {
      const createCb2 = () => {
        let calls = 0;
        return () => {
          calls = calls + 1;
          return calls < 3;
        };
      };
      const createRequestSpy2 = spyOn(
        request,
        "request"
      ).and.resolveTo({
        itemId: "newgs0123456789"
      });
      const updateItemRejectSpy = spyOn(
        common,
        "updateItemExtended"
      ).and.rejectWith("error");
      const removeSpy = spyOn(portalModule, "removeItem").and.rejectWith("error");
      WebToolProcessor.createItemFromTemplate(
        {
          id: "bc3",
          type: "Geoprocessing Service",
          item: {
            typeKeywords: ["Web Tool"],
            thumbnail: "thumb"
          },
          data: {
            notebookId: "123",
            name: "NotebookName"
          }
        } as any,
        {
          portalUrls: {
            notebooks: {
              https: [
                "notebookservice"
              ]
            }
          }
        },
        MOCK_USER_SESSION,
        createCb2()
      ).then(() => {
        expect(createRequestSpy2.calls.count()).toBe(1);
        expect(updateItemRejectSpy.calls.count()).toBe(1);
        expect(removeSpy.calls.count()).toBe(1);
        done();
      });
    });

    it("getItemBase", done => {
      const createCb2 = () => {
        let calls = 0;
        return () => {
          calls = calls + 1;
          return calls < 4;
        };
      };
      const createRequestSpy2 = spyOn(
        request,
        "request"
      ).and.resolveTo({
        itemId: "newgs0123456789"
      });
      const getItemBaseSpy = spyOn(common, "getItemBase").and.rejectWith("error");
      const removeSpy = spyOn(portalModule, "removeItem").and.resolveTo({
        success: true,
        itemId: "3ef"
      });
      WebToolProcessor.createItemFromTemplate(
        {
          id: "bc3",
          type: "Geoprocessing Service",
          item: {
            typeKeywords: ["Web Tool"],
            thumbnail: "thumb"
          },
          data: {
            notebookId: "123",
            name: "NotebookName"
          }
        } as any,
        {
          portalUrls: {
            notebooks: {
              https: [
                "notebookservice"
              ]
            }
          }
        },
        MOCK_USER_SESSION,
        createCb2()
      ).then(() => {
        expect(getItemBaseSpy.calls.count()).toBe(1);
        expect(createRequestSpy2.calls.count()).toBe(2);
        expect(removeSpy.calls.count()).toBe(1);
        done();
      });
    });

    it("getItemBase removeItem can handle reject", done => {
      const createCb2 = () => {
        let calls = 0;
        return () => {
          calls = calls + 1;
          return calls < 4;
        };
      };
      const createRequestSpy2 = spyOn(
        request,
        "request"
      ).and.resolveTo({
        itemId: "newgs0123456789"
      });
      const getItemBaseSpy = spyOn(common, "getItemBase").and.rejectWith("error");
      const removeSpy = spyOn(common, "removeItem").and.rejectWith("error");
      WebToolProcessor.createItemFromTemplate(
        {
          id: "bc3",
          type: "Geoprocessing Service",
          item: {
            typeKeywords: ["Web Tool"],
            thumbnail: "thumb"
          },
          data: {
            notebookId: "123",
            name: "NotebookName"
          }
        } as any,
        {
          portalUrls: {
            notebooks: {
              https: [
                "notebookservice"
              ]
            }
          }
        },
        MOCK_USER_SESSION,
        createCb2()
      ).then(() => {
        expect(getItemBaseSpy.calls.count()).toBe(1);
        expect(createRequestSpy2.calls.count()).toBe(2);
        expect(removeSpy.calls.count()).toBe(1);
        done();
      });
    });

    it("can handle failure to create Web Tool Geoprocessing Service", done => {
      const createRequestSpy2 = spyOn(
        request,
        "request"
      ).and.rejectWith("error");

      WebToolProcessor.createItemFromTemplate(
        {
          id: "bc3",
          type: "Geoprocessing Service",
          item: {
            typeKeywords: ["Web Tool"],
            thumbnail: "thumb"
          },
          data: {
            notebookId: "123",
            name: "NotebookName"
          }
        } as any,
        {
          portalUrls: {
            notebooks: {
              https: [
                "notebookservice"
              ]
            }
          }
        },
        MOCK_USER_SESSION,
        cb
      ).then(() => {
        expect(createRequestSpy2.calls.count()).toBe(1);
        done();
      });
    });
  });

  describe("createWebTool", () => {
    it("should reject if missing notebooks url", () => {
      WebToolProcessor.createWebTool(
        {
          id: "bc3",
          type: "Geoprocessing Service",
          item: { typeKeywords: ["Web Tool"] }
        } as any,
        {},
        MOCK_USER_SESSION,
      ).then(() => {}, (e) => {
        expect(e).toBeUndefined();
       })
    });

    it("should reject if missing portalUrls", () => {
      WebToolProcessor.createWebTool(
        {
          id: "bc3",
          type: "Geoprocessing Service",
          item: { typeKeywords: ["Web Tool"] }
        } as any,
        undefined,
        MOCK_USER_SESSION,
      ).then(() => {}, (e) => {
        expect(e).toBeUndefined();
       })
    });
  });
});
