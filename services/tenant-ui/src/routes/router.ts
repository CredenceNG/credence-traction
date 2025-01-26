// The default router for the Tenant UI backend
// Expand on this (or add other router files) if the TenantUI backend should do much more business actions
// other than serving the static files and proxying to Traction

import express, { Request, Response } from "express";
import config from "config";
import * as emailComponent from "../components/email";
import * as innkeeperComponent from "../components/innkeeper";
import * as tenantComponent from "../components/tenant";
import { body, validationResult } from "express-validator";
import { NextFunction } from "express";
import oidcMiddleware from "../middleware/oidcMiddleware";

export const router = express.Router();

// For the secured innkeepr OIDC login request to verify the token and get a token from Traction
router.get(
  "/innkeeperLogin",
  oidcMiddleware,
  async (req: any, res: Response, next: NextFunction) => {
    try {
      // Validate JWT from OIDC login before moving on
      // The realm access check below is pretty Keycloak specific
      // It's a TODO later to see how this could be a more generic OIDC claim
      console.log("Inside the BE");
      console.log("\n claims \n", req.claims);
      //console.log("resource access \n",req.claims.resource_access);
      //console.log(req);
      console.log("Printed .....");
      if (
        req.claims
        //.realm_access
        //&& req.claims.realm_access.roles
        // && req.claims.realm_access.roles.includes(
        //   config.get("server.oidc.roleName")
        // )
      ) {
        console.log("calling login in BE ...");
        const result = await innkeeperComponent.login();
        res.status(200).send(result);
      } else {
        console.log("Error 403 .... whatever");
        res.status(403).send();
      }
    } catch (error) {
      console.error(`Error logging in: ${error}`);
      next(error);
    }
  }
);


// Attempt to handle User Login here (callback after keycloak is passed)
router.get(
  "/backendlogin",
  oidcMiddleware,
  async (req: any, res: Response, next: NextFunction) => {
    try {
      // Validate JWT from OIDC login before moving on
      // The realm access check below is pretty Keycloak specific
      // It's a TODO later to see how this could be a more generic OIDC claim
      console.log("Inside the BE tenant route");
      console.log(req.claims);
      if (
        req.claims
        //&& req.claims.Tenant && req.claims.organization
        //req.claims.realm_access &&
        //req.claims.realm_access.roles
        // && req.claims.realm_access.roles.includes(
        //   config.get("server.oidc.roleName")
        // )
      ) {
        console.log("about to ..");
        const result = await tenantComponent.loginFromBackend(
          req.claims.email,
          req.claims.Tenant,
          req.claims.Organization
        );
        console.log("redirected");
        // if (result.approved){
        //send back the login credentials()
        res.status(200).send(result);
        //}else{
        //}
      } else {
        console.log("redirected - error");
        res.status(403).send();
      }
    } catch (error) {
      console.error(`Error logging in: ${error}`);
      next(error);
    }
  }
);


// Attempt to handle User Login here (callback after keycloak is passed)
router.get(
  "/login",
  oidcMiddleware,
  async (req: any, res: Response, next: NextFunction) => {
    try {
      // Validate JWT from OIDC login before moving on
      // The realm access check below is pretty Keycloak specific
      // It's a TODO later to see how this could be a more generic OIDC claim
      console.log("Inside the BE tenant route");
      console.log(req.claims);
      if (
        req.claims
        //&& req.claims.Tenant && req.claims.organization
        //req.claims.realm_access &&
        //req.claims.realm_access.roles
        // && req.claims.realm_access.roles.includes(
        //   config.get("server.oidc.roleName")
        // )
      ) {
        console.log("about to ..");
        const result = await tenantComponent.login(
          req.claims.email,
          req.claims.Tenant,
          req.claims.Organization
        );
        console.log("redirected");
        // if (result.approved){
        //send back the login credentials()
        res.status(200).send(result);
        //}else{
        //}
      } else {
        console.log("redirected - error");
        res.status(403).send();
      }
    } catch (error) {
      console.error(`Error logging in: ${error}`);
      next(error);
    }
  }
);

router.post(
  "/update",
  //oidcMiddleware,
  async (req: any, res: Response, next: NextFunction) => {
    console.log("Headers:", req.headers);
    console.log("Body:", req.body);
    try {
      console.log("print request before saving - email", req.body.email);
      console.log("print request before saving - wallet id", req.body.walletId);
      //walletId:walletId, walletKey:walletKey, email:email,tenant_name:tenant_name
      const result = await tenantComponent.update_login(
        req.body.email,
        req.body.walletId,
        req.body.walleyKey,
        req.body.tenant_name
      );

      res.json({ received: req.body });
      res.status(200).send();
    } catch (error) {
      console.error(`Error saving in: ${error}`);
      next(error);
    }
  }
);

// Protected reservation endpoint
router.post(
  "/innkeeperReservation",
  async (req: any, res: Response, next: NextFunction) => {
    try {
      // Get innkeeper token from login method
      const { token } = await innkeeperComponent.login();

      const result = await innkeeperComponent.createReservation(req, token);
      res.status(201).send(result);
    } catch (error) {
      next(error);
    }
  }
);
// Email endpoint
router.post(
  "/email/reservationConfirmation",
  body("contactEmail").isEmail(),
  body("reservationId").not().isEmpty(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
      }

      const result = await emailComponent.sendConfirmationEmail(req);
      res.send(result);
    } catch (error) {
      next(error);
    }
  }
);
router.post(
  "/email/reservationStatus",
  body("contactEmail").isEmail(),
  body("reservationId").not().isEmpty(),
  body("state").not().isEmpty(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
      }

      const result = await emailComponent.sendStatusEmail(req);
      res.send(result);
    } catch (error) {
      next(error);
    }
  }
);
