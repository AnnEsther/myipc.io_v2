import IPCLib from './IPCLib';
import IPCEng from './IPCEng';
import IPCInstance from './IPCInstance';

import config from '../config';

function ipc_get_randomized_token_id()
{
    let random_id = Math.random() * 12000;

    random_id+= Date.now();
    random_id = parseInt(random_id);
    random_id%= 2828;

    return random_id;;
}

async function fetch_from_backup_database(token_id)
{
  let responce = new IPCInstance.t_responce();

  let database = await fetch(config.PUBLIC_ROOT + "backup.json")
    .then(res => res.json())
    .catch(err => null);

  if (database == null) {

    responce.code = "BACKUP_DATABASE_FAILURE";
    responce.alert.title = "Fatal Error";
    responce.alert.content = "Cannot connect to primary or backup databases.";

    return responce;
  }

  responce.alert.type = "";
  responce.alert.content = "Warning: Using backup database, information may be outdated.";
        
  token_id--;
  if (token_id >= database.length) {

    responce.code = "IPC_DOESNT_EXIST";
    responce.alert.title = "IPC Error";
    responce.alert.content = "IPC " + (token_id + 1) + " does not exist.";
       
    return responce;
  };

  responce.payload = database[token_id];
  return responce;
}

function validate_token_id(token_id)
{
  let responce = new IPCInstance.t_responce();

  token_id = token_id.toString();
  if (token_id.match(/^\d+$/) == null) {

    responce.code = "TOKENID_NOT_A_NUMBER";
    responce.alert.title = "IPC Token ID Error";
    responce.alert.content = "IPC Token ID Must be a number and greater than 0.";

    return responce;    
  }

  token_id = parseInt(token_id);
  if (token_id <= 0) {

    responce.code = "TOKENID_LESS_THAN_ZERO";
    responce.alert.title = "IPC Token ID Error";
    responce.alert.content = "IPC Token ID must be greater than 0.";
  }

  return responce;
}

async function _handle_errors(result, token_id)
{
  let responce = new IPCInstance.t_responce();
  let ipc = null;

  if (result == null || result.status_label == "IPCDB_CONNECT_ERROR") {

    responce = await fetch_from_backup_database(token_id);

    if (responce.code != "")
      return responce;

    return responce;
  }
  else if (result.status_label == "IPCDB_IPC_NOTFOUND") {

    responce.code = "IPC_DOESNT_EXIST";
    responce.alert.title = "IPC Error";
    responce.alert.content = "IPC " + token_id + " does not exist.";

    return responce;
  }
  else ipc = result.responce;

  // If ipc == null, then a backend error was not handled and needs to be handled here.

  responce.payload = ipc;
  return responce;
}

async function fetch_ipc(token_id) {

  let responce = new IPCInstance.t_responce();

  if (token_id == 0 || typeof token_id == "undefined")
    token_id = ipc_get_randomized_token_id();

  responce = validate_token_id(token_id);
  if (responce.code != "")
    return responce;

  let result = await fetch(config.BACKEND_ROOT + "token_id/" + token_id)
    .then(res => res.json())
    .catch(err => null);

  responce = await _handle_errors(result, token_id);
  if (responce.code != "")
    return responce;

  let ipc = responce.payload;
  ipc = IPCLib.ipc_create_ipc_from_json(ipc);

  responce.payload = ipc;
  return responce;
}

async function ui_fetch_ipc(instance, token_id) {

  const controller = instance.controller['IPCExplorer'];
  if (typeof controller == 'undefined') return;

  if (instance.ipc != null) {

    if (token_id == instance.ipc.token_id) {

      controller.show(true);
      return;
    }
  }

  instance.showBackdrop(true);
  let responce = await fetch_ipc(token_id);
  instance.showBackdrop(false);

  if (responce.code != "") {

    instance.showAlert(
      responce.alert.title,
      responce.alert.content,
      responce.alert.type);

    return;
  }

  if (responce.alert.type == "defcon3")
    instance.showDefcon(responce.alert.content);

  instance.ipc = responce.payload;
  instance.label_ipc = IPCLib.ipc_create_label_ipc(instance.ipc, IPCEng)

  controller.show(true);
  controller.update();
}

const IPCUILib = {
  ui_fetch_ipc: ui_fetch_ipc
};

export default IPCUILib;
