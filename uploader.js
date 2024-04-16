var left_tab_map;
var top_tab_map;
var drag_counter = 0;
var upload_queue = [];
var upload_queue_processing = false;
var setted_up_for = undefined;

function scheduleFile(file, content) {
  upload_queue.push({file: file, content: content});

  if (!upload_queue_processing) {
    doQueuedUploads();
  }
}

function doQueuedUploads() {
  upload_queue_processing = true;
  if (upload_queue.length === 0) {
    upload_queue_processing = false;
    return;
  }

  const data = upload_queue.shift();

  doSetFileByName(data.file, data.content, doQueuedUploads);
}

function doSetFileByName(file, text, next) {
  const tabs = document.querySelectorAll('.tabs-group__item');

  if (file.name in left_tab_map) {
    left_tab_map[file.name].click();
  }
  else if (file.name in top_tab_map) {
    top_tab_map[file.name].click();
  }
  else {
    next();
    return;
  }


  setTimeout(() => {
    const index = getFileIndex(file.name);

    setFileContentByIndex(index, text);

    setTimeout(next, 100);
  }, 100);

  return true;
}

function getFileIndex(filename) {
  const top_tabs = [...document.querySelectorAll('.tabs-group__item')];
  top_labels = top_tabs.map(x => x.textContent);
  return top_labels.indexOf(filename);
}

function setFileContentByIndex(index, text) {
  const mirrors = document.querySelector('.trainer-editor__tabs-content').querySelectorAll('.CodeMirror');
  if (index >= 0 && index < mirrors.length) {
    const code_mirror = mirrors[index].CodeMirror;
    code_mirror.setValue(text);
  }
}

function setActiveFileContent(text) {
  const top_tabs = [...document.querySelector('.trainer-editor__tabs-header').querySelectorAll('.tabs-group__item')];
  top_active = top_tabs.map(x => x.classList.contains('tab_active'));
  const pos = top_active.indexOf(true);
  if (pos < 0) {
    return false;
  }
  return setFileContentByIndex(pos, text);
}

function getFileText(file, handler) {
  const reader = new FileReader();

  // Set the onload event handler
  reader.onload = () => {
    handler(reader.result);
  };

  // Read the file contents as a text string
  reader.readAsText(file);

  return true;
}

function uploadFile(file) {
  return getFileText(file, content => 
    scheduleFile(file, content)
  );
}

function uploadSingleFile(file) {
  return getFileText(file, content => 
    setActiveFileContent(content)
  );
}

function dragEnterHandler(ev) {
  if (++drag_counter > 0) {
    setted_up_for.classList.add('dragover');
  }
}

function dragLeaveHandler(ev) {
  if (--drag_counter <= 0) {
    dragReset();
  }
}

function dragReset(ev) {
  setted_up_for.classList.remove('dragover');
  drag_counter = 0;
}

function dropHandler(ev) {
  console.log("File(s) dropped");
  dragReset();
  setupTabs();
  const not_matched = [];

  // Prevent default behavior (Prevent file from being opened)
  ev.preventDefault();

  const files = ev.dataTransfer.items 
    ? [...ev.dataTransfer.items].filter(x=>x.kind==='file').map(x=>x.getAsFile())
    : [...ev.dataTransfer.files];

  if (files.length == 1) {
    uploadSingleFile(files[0]);
    return;
  }

  files.forEach((file, i) => {
    if ((file.name in left_tab_map) || (file.name in top_tab_map)){
      uploadFile(file);
    }
    else {
      not_matched.push(file.name);
    }
  });

  if(not_matched.length > 0) {
    alert("Следующие файлы не загружены:\n" + not_matched.join(',\n'));
  }
}

function setupTabs() {
  const left_tabs = document.querySelectorAll('.tree-node-file-system__name');
  left_tab_map = {};
  left_tabs.forEach((elem, i) => {
    left_tab_map[elem.textContent] = elem;
  });

  const top_tabs = document.querySelectorAll('.tabs-group__item.tabs__item');
  top_tab_map = {};
  top_tabs.forEach((elem, i) => {
    top_tab_map[elem.textContent] = elem;
  });
}

function setup() {
  const code_parent = document.querySelector('.tabs__content');
  if (code_parent === setted_up_for) {
    return;
  }

  if (code_parent) {
    code_parent.addEventListener('drop', dropHandler);
    code_parent.addEventListener('dragenter', dragEnterHandler);
    code_parent.addEventListener('dragleave', dragLeaveHandler);
    code_parent.addEventListener('dragend', dragReset);
  }

  setted_up_for = code_parent;
}

setInterval(setup, 500);