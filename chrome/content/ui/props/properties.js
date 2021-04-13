var file = null;
function onLoad()
{
  file = window.arguments[0];
  document.title = getStr("props.title", [file.leafName]);
  document.getElementById("chrome-url-text").value = file.href;
  document.getElementById("resolved-url-text").value = file.resolvedURI;
  document.getElementById("resolved-file-text").value = file.path; 
  document.getElementById("resolved-jarfile-text").value = file.path;
  document.getElementById("resolved-file").hidden = (file.scheme != "file");
  document.getElementById("resolved-jarfile").hidden = (file.scheme != "jar");

  if (file.TYPE == "ChromeDirectory")
    document.getElementById("file-size").hidden = true;
  else
    document.getElementById("file-size-text").value = getFormattedBytes(file.size);
  let manifestURI = file.getManifestURI();
  if (manifestURI) {
    document.getElementById("manifest-text").value = manifestURI.spec;
  }

  var flags;
  if (file.TYPE == "ChromeFile")
    flags = file.parent.flags;
  else
    flags = file.flags;
  document.getElementById("flags-text").value = flags;
  let addon = file.getAddon();
  if (addon.then) {
    addon.then(setAddonName);
  } else {
    setAddonName(addon);
  }
}

function setAddonName(name) {
  document.getElementById("addon-text").value = name;
}

