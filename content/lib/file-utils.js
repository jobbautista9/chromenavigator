/* -*- Mode: C++; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4 -*-
 *
 * ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is The JavaScript Debugger.
 *
 * The Initial Developer of the Original Code is
 * Netscape Communications Corporation.
 * Portions created by the Initial Developer are Copyright (C) 1998
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Robert Ginda, <rginda@netscape.com>, original author
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

/* notice that these valuse are octal. */
const PERM_IRWXU = 00700;  /* read, write, execute/search by owner */
const PERM_IRUSR = 00400;  /* read permission, owner */
const PERM_IWUSR = 00200;  /* write permission, owner */
const PERM_IXUSR = 00100;  /* execute/search permission, owner */
const PERM_IRWXG = 00070;  /* read, write, execute/search by group */
const PERM_IRGRP = 00040;  /* read permission, group */
const PERM_IWGRP = 00020;  /* write permission, group */
const PERM_IXGRP = 00010;  /* execute/search permission, group */
const PERM_IRWXO = 00007;  /* read, write, execute/search by others */
const PERM_IROTH = 00004;  /* read permission, others */
const PERM_IWOTH = 00002;  /* write permission, others */
const PERM_IXOTH = 00001;  /* execute/search permission, others */

const MODE_RDONLY   = 0x01;
const MODE_WRONLY   = 0x02;
const MODE_RDWR     = 0x04;
const MODE_CREATE   = 0x08;
const MODE_APPEND   = 0x10;
const MODE_TRUNCATE = 0x20;
const MODE_SYNC     = 0x40;
const MODE_EXCL     = 0x80;

const PICK_OK      = Components.interfaces.nsIFilePicker.returnOK;
const PICK_CANCEL  = Components.interfaces.nsIFilePicker.returnCancel;
const PICK_REPLACE = Components.interfaces.nsIFilePicker.returnReplace;

const FILTER_ALL    = Components.interfaces.nsIFilePicker.filterAll;
const FILTER_HTML   = Components.interfaces.nsIFilePicker.filterHTML;
const FILTER_TEXT   = Components.interfaces.nsIFilePicker.filterText;
const FILTER_IMAGES = Components.interfaces.nsIFilePicker.filterImages;
const FILTER_XML    = Components.interfaces.nsIFilePicker.filterXML;
const FILTER_XUL    = Components.interfaces.nsIFilePicker.filterXUL;

const FTYPE_DIR  = Components.interfaces.nsIFile.DIRECTORY_TYPE;
const FTYPE_FILE = Components.interfaces.nsIFile.NORMAL_FILE_TYPE;

// evald f = fopen("/home/rginda/foo.txt", MODE_WRONLY | MODE_CREATE)
// evald f = fopen("/home/rginda/vnk.txt", MODE_RDONLY)

var futils = new Object();

futils.umask = PERM_IWOTH | PERM_IWGRP;
futils.MSG_SAVE_AS = "Save As";
futils.MSG_OPEN = "Open";

futils.getPicker =
function futils_nosepicker(initialPath, typeList, attribs)
{
    const classes = Components.classes;
    const interfaces = Components.interfaces;

    const PICKER_CTRID = "@mozilla.org/filepicker;1";
    const LOCALFILE_CTRID = "@mozilla.org/file/local;1";

    const nsIFilePicker = interfaces.nsIFilePicker;
    const nsILocalFile = interfaces.nsILocalFile;

    var picker = classes[PICKER_CTRID].createInstance(nsIFilePicker);
    if (typeof attribs == "object")
    {
        for (var a in attribs)
            picker[a] = attribs[a];
    }
    else
        throw "bad type for param |attribs|";

    if (initialPath)
    {
        var localFile;

        if (typeof initialPath == "string")
        {
            localFile =
                classes[LOCALFILE_CTRID].createInstance(nsILocalFile);
            localFile.initWithPath(initialPath);
        }
        else
        {
            if (!(initialPath instanceof nsILocalFile))
                throw "bad type for argument |initialPath|";

            localFile = initialPath;
        }

        picker.displayDirectory = localFile
    }

    var allIncluded = false;

    if (typeof typeList == "string")
        typeList = typeList.split(" ");

    if (typeList instanceof Array)
    {
        for (var i in typeList)
        {
            switch (typeList[i])
            {
                case "$all":
                    allIncluded = true;
                    picker.appendFilters(FILTER_ALL);
                    break;

                case "$html":
                    picker.appendFilters(FILTER_HTML);
                    break;

                case "$text":
                    picker.appendFilters(FILTER_TEXT);
                    break;

                case "$images":
                    picker.appendFilters(FILTER_IMAGES);
                    break;

                case "$xml":
                    picker.appendFilters(FILTER_XML);
                    break;

                case "$xul":
                    picker.appendFilters(FILTER_XUL);
                    break;

                case "$noAll":
                    // This prevents the automatic addition of "All Files"
                    // as a file type option by pretending it is already there.
                    allIncluded = true;
                    break;

                default:
                    if ((typeof typeList[i] == "object") && isinstance(typeList[i], Array))
                        picker.appendFilter(typeList[i][0], typeList[i][1]);
                    else
                        picker.appendFilter(typeList[i], typeList[i]);
                    break;
            }
        }
    }

    if (!allIncluded)
        picker.appendFilters(FILTER_ALL);

    return picker;
}

function pickSaveAs (title, typeList, defaultFile, defaultDir, defaultExt)
{
    if (!defaultDir && "lastSaveAsDir" in futils)
        defaultDir = futils.lastSaveAsDir;

    var picker = futils.getPicker (defaultDir, typeList,
                                   {defaultString: defaultFile,
                                    defaultExtension: defaultExt});
    picker.init (window, title ? title : futils.MSG_SAVE_AS,
                 Components.interfaces.nsIFilePicker.modeSave);

    var reason;

    try
    {
        reason = picker.show();
    }
    catch (ex)
    {
        dd ("caught exception from file picker: " + ex);
    }

    var obj = new Object();

    obj.reason = reason;
    obj.picker = picker;

    if (reason != PICK_CANCEL)
    {
        obj.file = picker.file;
        futils.lastSaveAsDir = picker.file.parent;
    }
    else
    {
        obj.file = null;
    }

    return obj;
}

function pickOpen (title, typeList, defaultFile, defaultDir)
{
    if (!defaultDir && "lastOpenDir" in futils)
        defaultDir = futils.lastOpenDir;

    var picker = futils.getPicker (defaultDir, typeList,
                                   {defaultString: defaultFile});
    picker.init (window, title ? title : futils.MSG_OPEN,
                 Components.interfaces.nsIFilePicker.modeOpen);

    var rv = picker.show();

    if (rv != PICK_CANCEL)
        futils.lastOpenDir = picker.file.parent;

    return {reason: rv, file: picker.file, picker: picker};
}

function mkdir (localFile, perms)
{
    if (typeof perms == "undefined")
        perms = 0766 & ~futils.umask;

    localFile.create(FTYPE_DIR, perms);
}

function nsLocalFile(path)
{
    const LOCALFILE_CTRID = "@mozilla.org/file/local;1";
    const nsILocalFile = Components.interfaces.nsILocalFile;

    var localFile =
        Components.classes[LOCALFILE_CTRID].createInstance(nsILocalFile);
    localFile.initWithPath(path);
    return localFile;
}

function fopen (path, mode, perms, tmp)
{
    return new LocalFile(path, mode, perms, tmp);
}

function LocalFile(file, mode, perms, tmp)
{
    const classes = Components.classes;
    const interfaces = Components.interfaces;

    const LOCALFILE_CTRID = "@mozilla.org/file/local;1";
    const FILEIN_CTRID = "@mozilla.org/network/file-input-stream;1";
    const FILEOUT_CTRID = "@mozilla.org/network/file-output-stream;1";
    const SCRIPTSTREAM_CTRID = "@mozilla.org/scriptableinputstream;1";

    const nsIFile = interfaces.nsIFile;
    const nsILocalFile = interfaces.nsILocalFile;
    const nsIFileOutputStream = interfaces.nsIFileOutputStream;
    const nsIFileInputStream = interfaces.nsIFileInputStream;
    const nsIScriptableInputStream = interfaces.nsIScriptableInputStream;

    if (typeof perms == "undefined")
        perms = 0666 & ~futils.umask;

    if (typeof mode == "string")
    {
        switch (mode)
        {
            case ">":
                mode = MODE_WRONLY | MODE_CREATE | MODE_TRUNCATE;
                break;
            case ">>":
                mode = MODE_WRONLY | MODE_CREATE | MODE_APPEND;
                break;
            case "<":
                mode = MODE_RDONLY;
                break;
            default:
                throw "Invalid mode ``" + mode + "''";
        }
    }

    if (typeof file == "string")
    {
        this.localFile = new nsLocalFile(file);
    }
    else if (file instanceof nsILocalFile)
    {
        this.localFile = file;
    }
    else
    {
        throw "bad type for argument |file|.";
    }

    this.path = this.localFile.path;

    if (mode & (MODE_WRONLY | MODE_RDWR))
    {
        this.outputStream =
            classes[FILEOUT_CTRID].createInstance(nsIFileOutputStream);
        this.outputStream.init(this.localFile, mode, perms, 0);
    }

    if (mode & (MODE_RDONLY | MODE_RDWR))
    {
        this.baseInputStream =
            classes[FILEIN_CTRID].createInstance(nsIFileInputStream);
        this.baseInputStream.init(this.localFile, mode, perms, tmp);
        this.inputStream =
            classes[SCRIPTSTREAM_CTRID].createInstance(nsIScriptableInputStream);
        this.inputStream.init(this.baseInputStream);
    }
}

LocalFile.prototype.write =
function fo_write(buf)
{
    if (!("outputStream" in this))
        throw "file not open for writing.";

    return this.outputStream.write(buf, buf.length);
}

LocalFile.prototype.read =
function fo_read(max)
{
    if (!("inputStream" in this))
        throw "file not open for reading.";

    var av = this.inputStream.available();
    if (typeof max == "undefined")
        max = av;

    if (!av)
        return null;

    var rv = this.inputStream.read(max);
    return rv;
}

LocalFile.prototype.close =
function fo_close()
{
    if ("outputStream" in this)
        this.outputStream.close();
    if ("inputStream" in this)
        this.inputStream.close();
}

LocalFile.prototype.flush =
function fo_close()
{
    return this.outputStream.flush();
}


function writeFileToJar(jarFilePath, entryPath, filePath)
{
    const PR_RDONLY      = 0x01;
    const PR_WRONLY      = 0x02;
    const PR_RDWR        = 0x04;
    const PR_CREATE_FILE = 0x08;
    const PR_APPEND      = 0x10;
    const PR_TRUNCATE    = 0x20;
    const PR_SYNC        = 0x40;
    const PR_EXCL        = 0x80;

    var zipWriter = Components.Constructor("@mozilla.org/zipwriter;1", "nsIZipWriter");
    var zipW = new zipWriter();

    var jarFile = nsLocalFile(jarFilePath);
    zipW.open(jarFile, PR_RDWR);
    if (zipW.hasEntry(entryPath))
        zipW.removeEntry(entryPath, false);
    zipW.addEntryFile(entryPath,
                      Components.interfaces.nsIZipWriter.COMPRESSION_NONE, filePath, false);
    zipW.close();
    
    // Now for some magic. Mozilla caches lots of stuff for JARs, so as to enable faster read/write.
    // Unfortunately, that screws us over in this case, as it will have an open copy of a zipreader
    // somewhere that's stuck with the old pointers to files in the JAR. If we don't fix this,
    // lots of things break as they can't find the right files in the JAR anymore.
    // So, we will find this zipreader, close it and reopen it. It will then re-read the
    // zipfile, and will then work correctly. Hopefully.
    var jarProtocolHandler = iosvc.getProtocolHandler("jar").QueryInterface(Components.interfaces.nsIJARProtocolHandler);
    var jarCache = jarProtocolHandler.JARCache;
    var ourReader = jarCache.getZip(jarFile);
    ourReader.close();
    ourReader.open(jarFile);
}
