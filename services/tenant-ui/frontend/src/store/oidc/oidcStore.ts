import axios from 'axios';
import { watch } from 'vue';
import { defineStore, storeToRefs } from 'pinia';
import { ref } from 'vue';
import { useConfigStore } from '../configStore';
import { UserManager } from 'oidc-client-ts';
import { configStringToObject } from '@/helpers';
import { API_PATH } from '@/helpers/constants';
import { useTokenStore } from '../tokenStore';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';

// State
import { useReservationStore } from '@/store';
import { useTenantStore } from '@/store';

export const useOidcStore = defineStore('oidcStore', () => {
  // Stores
  const { config } = storeToRefs(useConfigStore());
  const { token } = storeToRefs(useTokenStore());
  // State setup
  const tokenStore = useTokenStore();
  // use the loading state from the store to disable the button...
  const tenantStore = useTenantStore();

  const toast = useToast();
  const router = useRouter();

  const settings: any = {
    authority: config.value.frontend.oidc.authority,
    client_id: config.value.frontend.oidc.client,
    // client_secret:"vjZOVeSz90KuzwTwkHtwIakrjxJkVmOM",
    redirect_uri: `${window.location.origin}`,
    response_type: 'code',
    automaticSilentRenew: false,
    post_logout_redirect_uri: `${window.location.origin}`,
    loadUserInfo: true,
    extraQueryParams: configStringToObject(
      config.value.frontend.oidc.extraQueryParams || ''
    ),
  };

  const userManager: UserManager = new UserManager(settings);

  userManager
    .signinRedirectCallback()
    .then(() => {
      loading.value = true;
    })
    .catch((err) => {
      console.error(err);
    });

  userManager.events.addUserLoaded(async () => {
    try {
      console.log("<adduser event");
      // State setup
      const configStore = useConfigStore();
      const { config } = storeToRefs(useConfigStore());

      const tokenStore = useTokenStore();
      const { token } = storeToRefs(useTokenStore());

      // Get the logged in user from the OIDC library
      const oidcUser = await userManager.getUser();
      user.value = oidcUser;

      // Use the user's access token JWT from the OIDC provider to call the innkeeper API
      // and get an innkeeper token
      const loginCfg = {
        headers: { Authorization: `Bearer ${oidcUser?.access_token}` },
      };
      console.log("<login ...  ");
      const response: any = await axios.get(API_PATH.BACKEND_LOGIN, loginCfg);
      token.value = response.data.token;
      if (token.value) localStorage.setItem('token-user', token.value);
      console.log(">adduser event");
      try {
        console.log("<load tenant");
        const results = await Promise.allSettled([
          tenantStore.getSelf(),
          //tenantStore.getTenantConfig(),
          //tenantStore.getIssuanceStatus(),
        ]);
        // if any the Tenant details fetch fails, throw the first error
        results.forEach((result) => {
          if (result.status === 'rejected') {
            throw result.reason;
          }
        });
        router.push({ name: 'Dashboard' });
        console.log(">load tenant");
      } catch (err) {
        console.log("load tenant error");
        console.error(err);
        toast.error(`Failure getting tenant info: ${err}`);
      } finally {
        //submitted.value = false;
      }

      // strip the oidc return params
      //window.history.pushState({}, document.title, '/dashboard');
      console.log(">adduser event");
    } catch (err: any) {
      error.value = err;
      console.error(err);
      toast.error(`Failure getting tenant info: ${err}`);
    } finally {
      loading.value = false;
    }
  });

  // State
  const loading: any = ref(false);
  const error: any = ref(null);
  const user: any = ref(null);

  // Getters

  // Ations
  async function login() {
    loading.value = true;
    return userManager.signinRedirect();
  }

  return {
    loading,
    error,
    user,
    login,
  };
});
