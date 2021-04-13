#!/bin/sh

rm chromenavigator-dev.xpi

zip -r9 chromenavigator-dev.xpi chrome/ defaults/ COPYING.MPL1.1 MPL-1.1 MPL-2.0 chrome.manifest install.rdf -x *.swp

