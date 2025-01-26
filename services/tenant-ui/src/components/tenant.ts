import axios from "axios";
import config from "config";
import { IID, ORM } from "typescript-nedb-orm";

const TRACURL: string = config.get("server.tractionUrl");
const INN_USER = config.get("server.innkeeper.user");
const INN_PW = config.get("server.innkeeper.key");

interface ITenant extends IID {
  email: string;
  walletId: string;
  walletKey: string;
  tenantName: string;
}

class Tenant extends ORM<ITenant> implements ITenant {
  email: string;
  walletId: string;
  walletKey: string;
  tenantName: string;

  constructor(tenant: ITenant) {
    super(tenant);
    this.email = tenant.email;
    this.walletId = tenant.walletId;
    this.walletKey = tenant.walletKey;
    this.tenantName = tenant.tenantName;
  }
}
/**
 * @function login
 * Use the configured Inkeeper Admin key to get the token
 * @returns {string} The inkeeper token
 */
export const loginFromBackend = async (
  email: string,
  tenantName: string,
  organization: string
) => {
  console.log("Retrieving token ...", tenantName);
  const found: ITenant | null = await Tenant.findOne<ITenant>({
    email: email,
  });

  if (found) {
    try {
      console.log("found ....");

      console.log("get token for existing tenant ...");
      const loginUrl = `${TRACURL}/multitenancy/wallet/${found.walletId}/token`;
      console.log(loginUrl);
      const payload = {
        wallet_key: found.walletKey,
      };
      const res = await axios({
        method: "post",
        url: loginUrl,
        data: payload,
      });
      const token = res.data.token;
      console.log("token", token);
      const data = { token: res.data.token };
      return data;
    } catch (error) {
      return error;
    }
  } else {
    try {
      console.log("< creating reservation ...");
      const loginUrl = `${TRACURL}/multitenancy/reservations`;
      console.log(loginUrl);
      const payload = {
        contact_email: email,
        tenant_name: tenantName,
      };
      const res = await axios({
        method: "post",
        url: loginUrl,
        data: payload,
      });
      const res_id = res.data.reservation_id;
      const res_pwd = res.data.reservation_pwd;
      console.log(res_id);
      console.log(res_pwd);
      console.log("> creating reservation ...");

      console.log("< checkIn reservation...");
      const cloginUrl = `${TRACURL}/multitenancy/reservations/${res_id}/check-in`;
      console.log(loginUrl);
      const cpayload = {
        reservation_pwd: res_pwd,
      };
      const cres = await axios({
        method: "post",
        url: cloginUrl,
        data: cpayload,
      });
      const wallet_id = cres.data.wallet_id;
      const wallet_key = cres.data.wallet_key;
      const token = cres.data.token;
      console.log("> checkIn reservation...");

      console.log("< Saving to the vault ....");
      const tenant = new Tenant({
        email: email,
        walletId: cres.data.wallet_id,
        walletKey: cres.data.wallet_key,
        tenantName: tenantName,
      });
      const savedTenant: ITenant = await tenant.save();
      console.log("> Saving to the vault ....");

      console.log("token", token);
      const data = { token: res.data.token };
      return data;
    } catch (error) {
      return error;
    }
  }
};

export const login = async (
  email: string,
  tenantName: string,
  organization: string
) => {
  console.log("Retrieving token ...", tenantName);
  const found: ITenant | null = await Tenant.findOne<ITenant>({
    email: email,
  });

  if (found) {
    console.log("found ....");
    //check if reservation status. If approved, proceed to tenat page, else check status
   
      const data = {
        walletId: found.walletId,
        walletKey: found.walletKey,
      };
      return data;
    
  } else {
    //add to our listt
    console.log("Not found ....");
    const tenant = new Tenant({
      email: email,
      walletId: "",
      walletKey: "",
      tenantName: tenantName
    });
    const savedTenant: ITenant = await tenant.save();

    const data = { approved: false, walletId: "", walletKey: "" };
    return data;
  }
};

export const update_login = async (
  email: string,
  walletId: string,
  walletKey: string,
  tenantName: string
) => {
  //const result = await tenantComponent.save(req.email, req.walletId, req.walleyKey, req.tenant_name);

  console.log("Updating ...", tenantName);

  const found: ITenant | null = await Tenant.findOne<ITenant>({
    email: email,
  });

  if (found) {
    console.log("found ....");
    //check if reservation status. If approved, proceed to tenat page, else check status
    console.log("Found \n", found.email);
    found.email = email;
    found.walletId = walletId;
    found.walletKey = walletKey;
    found.tenantName = tenantName;
    const edited = new Tenant(found);
    const saved = await edited.save();
    console.log("saved \n", saved.email);
  } else {
    //add to our listt
    console.log("Not found ....");
    const tenant = new Tenant({
      email: email,
      walletId: walletId,
      walletKey: walletKey,
      tenantName: tenantName,

    });
    const savedTenant: ITenant = await tenant.save();

    const data = { approved: true, walletId: walletKey, walletKey: walletKey };
    return data;
  }
};
/**
 * @function createReservation
 * Create a reservation in Traction
 * @returns {object} the reservation object
 */
export const createReservation = async (req: any, token: string) => {
  try {
    console.log("createing reservation ...");
    const auth = `Bearer ${token}`;
    const reservationUrl = `${TRACURL}/innkeeper/reservations`;
    const payload = req.body;

    const res = await axios({
      method: "post",
      url: reservationUrl,
      data: payload,
      headers: {
        Authorization: auth,
      },
    });
    console.log("creating reservation result", res.data);
    return res.data;
  } catch (error) {
    return error;
  }
};

//add to our listt

// curl -X 'POST' \
//   'http://localhost:8032/multitenancy/reservations' \
//   -H 'accept: application/json' \
//   -H 'Content-Type: application/json' \
//   -d '{
//   "contact_email": "string@string.com",
//   "context_data": {
//     "contact_phone": "555-555-5555"
//   },
//   "tenant_name": "STRINGY"
// }'
//Response:
// {
//   "reservation_id": "d6d23d9f04a84972960937ca994b0bd5",
//   "reservation_pwd": "8a09f5ecb33e467e892eb620cebb6560"
// }

// curl -X 'POST' \
//   'http://localhost:8032/multitenancy/reservations/d6d23d9f04a84972960937ca994b0bd5/check-in' \
//   -H 'accept: application/json' \
//   -H 'Content-Type: application/json' \
//   -d '{
//   "reservation_pwd": "8a09f5ecb33e467e892eb620cebb6560"
// }'
//Response
// {
//   "wallet_id": "552a8d05-cf2c-4e35-ac3f-5c79360a4a41",
//   "wallet_key": "f924c97b-a6a9-4421-a591-1301c153e197",
//   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ3YWxsZXRfaWQiOiI1NTJhOGQwNS1jZjJjLTRlMzUtYWMzZi01Yzc5MzYwYTRhNDEiLCJpYXQiOjE3Mzc4NzEwODEsImV4cCI6MTczNzk1NzQ4MX0.pmhI2ymFtCimpMrw6ImPBQ-wZ7rkLgS70QaX7ID2LVk"
// }

// console.log("update the vault")
// found.=true;
// const edited = new Tenant(found);
// const saved = await edited.save()
// console.log("saved \n", saved.email);
