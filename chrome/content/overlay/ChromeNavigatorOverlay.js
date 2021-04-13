function startChromeNavigator()
{
  window.openDialog("chrome://chromenavigator/content/chromenavigator.xul",
      "chrome-browser", "resizable,dialog=no,status",
      {url: "chrome://"});
}
