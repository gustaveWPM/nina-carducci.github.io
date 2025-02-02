let _asyncMauGalleryLauncher = {
  LauncherCls: class LauncherCls {
    constructor() {
      this.failedToLoadMauGalleryMsg = 'Le chargement de la galerie a échoué ! Veuillez essayer de recharger la page.';
      this.boostrapIsAsyncLoadedSomewhereElseInMyCodebasePleaseDoNotAsyncLoadItHereImBeggingYou = false;
      this.globalMauGalleryConfig = {
        mauPrefixClass: 'mau',
        galleryPlaceholderClass: 'gallery-placeholder'
      };

      this.readyToMountGalleriesComponents = false;
      this.mauGalleriesConfig = [];

      this.PKGData = {
        bootstrap: {
          name: 'Bootstrap v5.2.3 (JS)',
          url: 'https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js',
          requiredFeatures: ['bootstrap.Modal', 'bootstrap.Carousel'],
          integrity: 'sha384-kenU1KFdBIe4zVF0s0G1M5b4hcpxyD9F7jL+jjXkk+Q2h455rYXK/7HAuoJl+0I4',
          crossorigin: 'anonymous',
          injectionProperties: {
            async: true
          }
        },

        mauGallery: {
          name: 'MauGallery',
          url: './assets/code/js/maugallery.js',
          requiredFeatures: ['bootstrap.Modal', 'bootstrap.Carousel', '_mauGalleryManager']
        }
      };

      this.mauGalleryCallbacks = [
        function injectGlobalConfig() {
          Object.assign(_asyncMauGalleryLauncher.Launcher.globalMauGalleryConfig, _mauGalleryManager.mauGalleryGlobalConfig);
          Object.assign(_mauGalleryManager.mauGalleryGlobalConfig, _asyncMauGalleryLauncher.Launcher.globalMauGalleryConfig);
          Object.freeze(_mauGalleryManager.mauGalleryGlobalConfig);
        },

        function runMauGallery() {
          const launcherPtr = _asyncMauGalleryLauncher;
          const coroutine = setInterval(() => {
            if (launcherPtr.Launcher.readyToMountGalleriesComponents) {
              clearInterval(coroutine);
              launcherPtr.Launcher.mauGalleriesConfig.forEach((conf) => {
                new _mauGalleryManager.MauGallery(conf);
                const galleryPlaceholderClass = _mauGalleryManager.options('galleryPlaceholderClass');
                const placeholder = document.querySelector(`#${conf.galleryRootNodeId} .${galleryPlaceholderClass}`);
                if (placeholder) placeholder.remove();
              });
            }
          }, 1);
        }
      ];

      this.launcherConfig = {
        customAsyncBootstrapLoadTimeout: undefined,
        defaultCheckRequiredFeaturesTimeout: 2500,
        defaultMaximumPackageFetchRetry: 50,
        defaultRetryFetchPackageDelay: 50,
        ignoreDOMContentLoaded: true,
        ignorePotentialInjectionSecuritiesChecks: true,
        ASYNC_LAUNCHER_DEBUG_MODE: false,
        ASYNC_LAUNCHER_DEBUG_MODE_FORMATTED_MSG: false,
        needles: {
          bootstrap: '/npm/bootstrap@'
        }
      };

      this.waitCounter = 0;
      this.DOMContentLoaded = false;

      function injectGalleriesConfigs(me) {
        window.addEventListener('load', () => {
          const mauPrefixClass = me.globalMauGalleryConfig.mauPrefixClass;
          const galleryElements = document.querySelectorAll(`[data-${mauPrefixClass}-gallery-id]`);
          me.mauGalleriesConfig = [];

          galleryElements.forEach((currentGalleryInstanceDOMElement) => {
            const galleryRootNodeId = currentGalleryInstanceDOMElement.getAttribute(`data-${mauPrefixClass}-gallery-id`);
            const currentGalleryConfig = {
              galleryRootNodeId,
              lightBox: currentGalleryInstanceDOMElement.getAttribute(`data-${mauPrefixClass}-lightbox`) === 'true',
              navigation: currentGalleryInstanceDOMElement.getAttribute(`data-${mauPrefixClass}-navigation`) === 'true',
              showTags: currentGalleryInstanceDOMElement.getAttribute(`data-${mauPrefixClass}-showtags`) === 'true',
              tagsPosition: currentGalleryInstanceDOMElement.getAttribute(`data-${mauPrefixClass}-tagsposition`),
              mutableOptions: currentGalleryInstanceDOMElement.getAttribute(`data-${mauPrefixClass}-mutable-options`) === 'true',
              columns: {
                xs: parseInt(currentGalleryInstanceDOMElement.getAttribute(`data-${mauPrefixClass}-columns-xs`)),
                sm: parseInt(currentGalleryInstanceDOMElement.getAttribute(`data-${mauPrefixClass}-columns-sm`)),
                md: parseInt(currentGalleryInstanceDOMElement.getAttribute(`data-${mauPrefixClass}-columns-md`)),
                lg: parseInt(currentGalleryInstanceDOMElement.getAttribute(`data-${mauPrefixClass}-columns-lg`)),
                xl: parseInt(currentGalleryInstanceDOMElement.getAttribute(`data-${mauPrefixClass}-columns-xl`))
              }
            };
            currentGalleryInstanceDOMElement.id = galleryRootNodeId;
            me.mauGalleriesConfig.push(currentGalleryConfig);
            me.readyToMountGalleriesComponents = true;
          });
        });
      }

      injectGalleriesConfigs(this);
    }

    debugger(msg, maybeError = false) {
      if (!this.launcherConfig.ASYNC_LAUNCHER_DEBUG_MODE) return;

      const label = 'Mau Gallery Async Loader';
      const processLog = (generatedLogMsg, maybeError) => (maybeError ? console.error(generatedLogMsg) : console.log(generatedLogMsg));
      if (Array.isArray(msg)) {
        const processDump = (msg, maybeError) => msg.forEach((objDump) => processLog(objDump, maybeError));
        const ctx = 'DUMP';
        const generatedLogMsg = `[${ctx} | ${label}]`;
        processLog(generatedLogMsg, maybeError);
        processDump(msg, maybeError);
        return;
      }
      const ctx = maybeError ? 'DEBUG ERROR' : 'DEBUG INFO';
      const generatedLogMsg = `[${ctx} | ${label}] ${msg}`;
      processLog(generatedLogMsg, maybeError);
    }

    async installer(packageAndItsDependencies) {
      const doNotInjectInDOMStatus = 999;
      const alreadyLoadedInWindowStatus = 998;

      function getTimerCurrentValue(me) {
        return me.waitCounter;
      }

      function increaseTimer(me, increaseAmount) {
        me.waitCounter += increaseAmount;
      }

      function resetTimer(me) {
        me.waitCounter = 0;
      }

      async function wait(me, ms) {
        await new Promise((resolve) => setTimeout(resolve, ms));
        increaseTimer(me, ms);
      }

      async function runCallbacksCollectionSequentially(callbacks) {
        if (Array.isArray(callbacks)) {
          for (const f of callbacks) {
            await f();
          }
        }
      }

      function alreadyInDOM(url, needle = undefined) {
        if (needle) {
          const matchingNeedleDOMElement = document.querySelector(`script[src*="${needle}"]`);
          if (matchingNeedleDOMElement) return matchingNeedleDOMElement;
        }
        return document.querySelector(`script[src="${url}"]`);
      }

      function anyRequiredFeatureFoundInWindow(requiredFeatures) {
        if (requiredFeatures.length === 0) return false;

        for (const feature of requiredFeatures) {
          try {
            eval(feature.toString());
            return feature;
          } catch {
          } finally {
            const decompositionTokens = feature.split('.');
            let brokeTheChain = false;
            let oldObj = {};
            for (const t of decompositionTokens) {
              oldObj = oldObj[t] ?? window[t];
              if (!oldObj) {
                brokeTheChain = true;
                break;
              }
            }
            if (!brokeTheChain) return feature;
          }
        }

        return false;
      }

      function requiredFeaturesFoundInWindow(requiredFeatures) {
        if (requiredFeatures.length === 0) return false;

        for (const feature of requiredFeatures) {
          let succesfullyEvaluated = false;
          try {
            eval(feature.toString());
            succesfullyEvaluated = true;
          } catch {
          } finally {
            if (succesfullyEvaluated) continue;
            const decompositionTokens = feature.split('.');
            let oldObj = {};
            for (const t of decompositionTokens) {
              oldObj = oldObj[t] ?? window[t];
              if (!oldObj) return false;
            }
          }
        }
        return true;
      }

      function skipPostInjectExecutionCallbacksCode(me, postInject) {
        if (postInject.killswitchOnAnyFeatureConflictPolicy) {
          const conflictFeatureFound = anyRequiredFeatureFoundInWindow(postInject.conflictFeatures);
          if (conflictFeatureFound) {
            me.debugger(`Did not append the postInjectCallback: found ${conflictFeatureFound}`);
            return true;
          }
        } else if (requiredFeaturesFoundInWindow(postInject.conflictFeatures)) {
          me.debugger('Did not append the postInjectCallback: found ALL the conflict features!');
          return true;
        }
        return false;
      }

      async function fetchPackage(me, pkg) {
        const isErrorResponse = (responseStatus) => responseStatus >= 400 && responseStatus <= 599;

        async function processFetch(pkg) {
          try {
            const response = await fetch(url);
            if (isErrorResponse(response.status)) {
              throw new Error(
                `Failed to fetch ${pkg.name}!\nGot an error response: ${response.status}\nVisit https://http.cat to know what it means.`
              );
            }
            if (pkg.options.injectionProperties.inlineInject) pkg.inlineCode = await response.text();
          } catch (error) {
            throw error;
          }
        }

        function getNeedle(me, packageName) {
          let needle = undefined;

          for (const needleKey of Object.keys(me.launcherConfig.needles)) {
            if (packageName.toLowerCase().includes(needleKey)) {
              needle = me.launcherConfig.needles[needleKey];
              break;
            }
          }
          return needle;
        }

        const url = pkg.url;
        const requiredFeatures = pkg.requiredFeatures;
        const needle = getNeedle(me, pkg.name);
        if (pkg.options.injectionProperties.alreadyAsyncLoadedSomewhereElse) {
          me.debugger(`Didn't fetch ${pkg.name} because of the 'alreadyAsyncLoadedSomewhereElse' injection property of this package.`);
          return doNotInjectInDOMStatus;
        } else if (requiredFeaturesFoundInWindow(requiredFeatures)) {
          if (me.ASYNC_LAUNCHER_DEBUG_MODE) {
            const becuzMsg = 'because ALL the following required features has been found in the `window` object:';
            const requiredFeaturesStr = me.ASYNC_LAUNCHER_DEBUG_MODE_FORMATTED_MSG ? `(${requiredFeatures.join(', ')})` : `(${requiredFeatures})`;

            me.debugger(`Didn't fetch ${pkg.name} ${becuzMsg} ${requiredFeaturesStr}.\n`);
          }
          return alreadyLoadedInWindowStatus;
        } else if (alreadyInDOM(url, needle)) {
          if (needle) {
            me.debugger(
              `Didn't fetch ${pkg.name} because there is a matching <script> element in the DOM (needle found in a 'src' attribute).\n(Needle: ${needle})`
            );
          } else {
            me.debugger(
              `Didn't fetch ${pkg.name} because there is a matching <script> element in the DOM (exactly same 'src' attribute than the package URL).\n( ${url} )`
            );
          }
          return doNotInjectInDOMStatus;
        } else {
          async function tryFetch(pkg) {
            try {
              const fetchReturnedStatus = await processFetch(pkg);
              return fetchReturnedStatus;
            } catch (error) {
              throw error;
            }
          }

          let error = undefined;
          const max = pkg.options.injectionProperties.maximumPackageFetchRetry;
          for (let retryCounter = 1; retryCounter <= max; retryCounter++) {
            try {
              await tryFetch(pkg);
              error = undefined;
            } catch (catchedError) {
              error = catchedError;
              await wait(me, pkg.retryFetchPackageDelay);
            }
            if (!error) {
              resetTimer(me);
              break;
            } else {
              me.debugger(`Failed to fetch ${pkg.name}. Retrying (${retryCounter}/${pkg.options.injectionProperties.maximumPackageFetchRetry})`);
            }
          }

          if (error) {
            await runCallbacksCollectionSequentially(pkg.options.injectionProperties.errorCallbacks);
            throw error;
          }
        }
      }

      async function injectPackageScriptInDOM(me, pkg) {
        function prepareScriptElement(injectionProperties) {
          const script = document.createElement('script');
          script.setAttribute('src', '');
          if (injectionProperties.integrity) script.integrity = injectionProperties.integrity;
          if (injectionProperties.crossOrigin) script.crossOrigin = injectionProperties.crossOrigin;
          if (injectionProperties.async !== undefined) {
            if (injectionProperties.async) script.async = true;
          } else script.async = true;

          if (injectionProperties.defer !== undefined) {
            if (injectionProperties.defer) script.defer = true;
          } else script.defer = true;
          return script;
        }

        function getInjectInlineScriptInstance(me, code, injectionProperties, postInject) {
          const script = prepareScriptElement(injectionProperties);
          script.removeAttribute('src');

          const skipPostInjectCallbacks = skipPostInjectExecutionCallbacksCode(me, postInject);
          let postInjectExecutionCallbacksCode = '';
          if (!skipPostInjectCallbacks) {
            if (Array.isArray(postInject.postInjectExecutionCallbacks)) {
              postInject.postInjectExecutionCallbacks.forEach((f) => (postInjectExecutionCallbacksCode += `${f.toString()}\n${f.name}();\n`));
            }
          }

          const plainCode = `${code}\n${postInjectExecutionCallbacksCode}`;
          const inlineScript = document.createTextNode(plainCode);
          script.appendChild(inlineScript);

          if (!me.launcherConfig.ignorePotentialInjectionSecuritiesChecks) {
            if (
              !script.outerHTML.includes(code) ||
              (postInjectExecutionCallbacksCode !== '' && !script.outerHTML.includes(postInjectExecutionCallbacksCode))
            ) {
              const youBlockedMeHard = document.createElement('div');
              youBlockedMeHard.classList.add('you-blocked-me-hard');
              return youBlockedMeHard;
            }
          }
          return script;
        }

        function getInjectExternalScriptInstance(url, injectionProperties) {
          const script = prepareScriptElement(injectionProperties);
          script.src = url;
          return script;
        }

        if (!me.launcherConfig.ignoreDOMContentLoaded) {
          while (!me.DOMContentLoaded) await wait(me, 1);
          resetTimer(me);
        }

        let script = undefined;
        if (pkg.options.injectionProperties.inlineInject) {
          script = getInjectInlineScriptInstance(me, pkg.inlineCode, pkg.options.injectionProperties, pkg.options.postInject);
        } else script = getInjectExternalScriptInstance(pkg.url, pkg.options.injectionProperties);

        const injectablePackage = async (pkg, script) => {
          try {
            const virtualInjectedScriptInstance = await document.body.appendChild(script);
            if (virtualInjectedScriptInstance.tagName !== 'SCRIPT') return false;
            if (!pkg.options.injectionProperties.inlineInject) {
              if (pkg.url !== script.src || virtualInjectedScriptInstance.src !== script.src) return false;
            } else if (virtualInjectedScriptInstance.outerHTML !== script.outerHTML) return false;
            return true;
          } catch {
            return false;
          }
        };

        if (!me.launcherConfig.ignorePotentialInjectionSecuritiesChecks) {
          const isInjectable = await injectablePackage(pkg, script);
          if (!isInjectable) {
            me.debugger(['Failed to inject a script, here is its dump:', script]);
            await runCallbacksCollectionSequentially(pkg.options.injectionProperties.errorCallbacks);
            throw new Error('Loading script in the DOM has failed!');
          }
        }
        document.body.appendChild(script);
        me.debugger(['Injected a script, here is its dump:', script]);
      }

      async function dlExecPackage(me, pkg) {
        function preventDlExec(pkgOptions) {
          if (pkgOptions.killswitchOnAnyFeatureConflictPolicy) {
            const conflictFeatureFound = anyRequiredFeatureFoundInWindow(pkgOptions.conflictFeatures);
            if (conflictFeatureFound) {
              throw new Error(`Did not append ${pkg.name}. Found a conflict feature: ${conflictFeatureFound}. Aborted.`);
            }
          } else if (requiredFeaturesFoundInWindow(pkgOptions.conflictFeatures)) {
            throw new Error(`Did not append ${pkg.name}. Found ALL its conflicts features in window!`);
          }
        }

        try {
          try {
            preventDlExec(pkg.options);
          } catch (error) {
            throw error;
          }

          const fetchResponse = await fetchPackage(me, pkg);
          if (fetchResponse === doNotInjectInDOMStatus || fetchResponse === alreadyLoadedInWindowStatus) {
            me.debugger(`Didn't inject ${pkg.name}.`);
          } else await injectPackageScriptInDOM(me, pkg);

          if (!pkg.options.injectionProperties.inlineInject) {
            if (fetchResponse != doNotInjectInDOMStatus && fetchResponse != alreadyLoadedInWindowStatus) {
              while (!requiredFeaturesFoundInWindow(pkg.requiredFeatures)) {
                await wait(me, 5);
                if (getTimerCurrentValue(me) > pkg.options.injectionProperties.checkRequiredFeaturesTimeout) {
                  throw new Error('Check required features timed out!');
                }
              }
              const postInject = pkg.options.postInject;
              me.debugger(`Fully checked ${pkg.name} required features in ~${getTimerCurrentValue(me)}ms.`);
              resetTimer(me);
              const skip = skipPostInjectExecutionCallbacksCode(this, postInject);
              if (!skip) {
                runCallbacksCollectionSequentially(pkg.options.postInject.postInjectExecutionCallbacks);
                me.debugger(`Ran ${pkg.name} post-inject payloads.`);
              }
            }
          }
        } catch (error) {
          throw error;
        }
      }

      for (const p of packageAndItsDependencies.dependencies) {
        try {
          this.debugger(['Called dlExecPackage(Package), here is the dump of Package:', p]);
          await dlExecPackage(this, p);
        } catch (error) {
          throw error;
        }
      }

      try {
        this.debugger(['Called dlExecPackage(Package), here is the dump of Package:', packageAndItsDependencies.targetPackage]);
        await dlExecPackage(this, packageAndItsDependencies.targetPackage);
      } catch (error) {
        throw error;
      }
    }

    async loadMauGallery() {
      function terminate() {
        _asyncMauGalleryLauncher = undefined;
      }

      function getBootstrapPackageObj(me) {
        const name = me.PKGData.bootstrap.name;
        const url = me.PKGData.bootstrap.url;
        const requiredFeatures = me.PKGData.bootstrap.requiredFeatures;
        const options = {
          injectionProperties: {
            alreadyAsyncLoadedSomewhereElse: me['boostrapIsAsyncLoadedSomewhereElseInMyCodebasePleaseDoNotAsyncLoadItHereImBeggingYou'],
            crossOrigin: me.PKGData.bootstrap.crossorigin,
            integrity: me.PKGData.bootstrap.integrity
          }
        };
        const customAsyncBootstrapTimeout = me.launcherConfig.customAsyncBootstrapLoadTimeout;
        if (customAsyncBootstrapTimeout) {
          options.injectionProperties.defaultCheckRequiredFeaturesTimeout = customAsyncBootstrapTimeout;
        }
        return new _asyncMauGalleryLauncher.PackageCls(name, url, requiredFeatures, options);
      }

      function getMauGalleryPackageObj(me) {
        const name = me.PKGData.mauGallery.name;
        const url = me.PKGData.mauGallery.url;
        const requiredFeatures = me.PKGData.mauGallery.requiredFeatures;
        const options = {
          injectionProperties: {
            inlineInject: true,
            errorCallbacks: [
              async function failedToInjectMauGallery() {
                const mauPrefixClass = _asyncMauGalleryLauncher.Launcher.globalMauGalleryConfig.mauPrefixClass;
                const galleryPlaceholderClass = _asyncMauGalleryLauncher.Launcher.globalMauGalleryConfig.galleryPlaceholderClass;
                const placeholders = document.querySelectorAll(`.${mauPrefixClass}.${galleryPlaceholderClass}`);
                placeholders.forEach(
                  (element) =>
                    (element.outerHTML = `<div class="${mauPrefixClass} ${galleryPlaceholderClass} text-center alert alert-danger" role="alert">${_asyncMauGalleryLauncher.Launcher.failedToLoadMauGalleryMsg}</div>`)
                );
              }
            ]
          },
          postInject: {
            postInjectExecutionCallbacks: me.mauGalleryCallbacks,
            conflictFeatures: []
          }
        };
        return new _asyncMauGalleryLauncher.PackageCls(name, url, requiredFeatures, options);
      }

      const boostrapPackageObj = getBootstrapPackageObj(this);
      const mauGalleryPackageObj = getMauGalleryPackageObj(this);
      const packageAndItsDependencies = new _asyncMauGalleryLauncher.PackageAndItsDependencies(mauGalleryPackageObj, [boostrapPackageObj]);
      try {
        await this.installer(packageAndItsDependencies);
      } catch (error) {
        const isError = true;
        this.debugger(error, isError);
      } finally {
        terminate();
      }
    }
  },

  PackageCls: class PackageCls {
    constructor(name, url, requiredFeatures, opt = {}) {
      this.name = name;
      this.url = url;
      this.requiredFeatures = requiredFeatures;
      this.options = {
        conflictFeatures: [],
        killswitchOnAnyFeatureConflictPolicy: true,
        injectionProperties: {
          errorCallbacks: [],
          alreadyAsyncLoadedSomewhereElse: undefined,
          checkRequiredFeaturesTimeout: undefined,
          retryFetchPackageDelay: undefined,
          maximumPackageFetchRetry: undefined,
          inlineInject: undefined,
          crossOrigin: undefined,
          integrity: undefined,
          async: undefined,
          defer: undefined
        },
        postInject: {
          postInjectExecutionCallbacks: [],
          conflictFeatures: [],
          killswitchOnAnyFeatureConflictPolicy: true
        }
      };

      Object.assign(this.options, opt);

      if (!this.options.injectionProperties.checkRequiredFeaturesTimeout) {
        this.options.injectionProperties.checkRequiredFeaturesTimeout =
          _asyncMauGalleryLauncher.Launcher.launcherConfig.defaultCheckRequiredFeaturesTimeout;
      }

      if (!this.options.injectionProperties.maximumPackageFetchRetry) {
        this.options.injectionProperties.maximumPackageFetchRetry = _asyncMauGalleryLauncher.Launcher.launcherConfig.defaultMaximumPackageFetchRetry;
      }

      if (!this.options.injectionProperties.retryFetchPackageDelay) {
        this.options.injectionProperties.retryFetchPackageDelay = _asyncMauGalleryLauncher.Launcher.launcherConfig.defaultRetryFetchPackageDelay;
      }

      this.inlineCode = undefined;
    }
  },

  PackageAndItsDependencies: class PackageAndItsDependencies {
    constructor(targetPackage, dependencies) {
      this.targetPackage = targetPackage;
      this.dependencies = new Set();
      dependencies.forEach((dependency) => this.dependencies.add(dependency));
    }
  }
};

// * ... Instances
Object.assign(_asyncMauGalleryLauncher, {
  Launcher: new _asyncMauGalleryLauncher.LauncherCls()
});

// * ... DOMContentLoaded optional handler
if (!_asyncMauGalleryLauncher.Launcher.launcherConfig.ignoreDOMContentLoaded) {
  document.addEventListener('DOMContentLoaded', () => (_asyncMauGalleryLauncher.Launcher.DOMContentLoaded = true));
}

// * ... Entry point
_asyncMauGalleryLauncher.Launcher.loadMauGallery();
