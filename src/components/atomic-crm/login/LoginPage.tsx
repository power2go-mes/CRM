import { useEffect, useRef, useState } from "react";
import { Form, required, useLogin, useNotify, useTranslate } from "ra-core";
import type { SubmitHandler, FieldValues } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/admin/text-input";
import { Notification } from "@/components/admin/notification";
import { useConfigurationContext } from "@/components/atomic-crm/root/ConfigurationContext.tsx";
import { SSOAuthButton } from "./SSOAuthButton";
import {
  disableEmailPasswordAuthentication,
  googleWorkplaceDomain,
} from "./authConfig";

/**
 * Login page displayed when authentication is enabled and the user is not authenticated.
 *
 * Automatically shown when an unauthenticated user tries to access a protected route.
 * Handles login via authProvider.login() and displays error notifications on failure.
 *
 * @see {@link https://marmelab.com/shadcn-admin-kit/docs/loginpage LoginPage documentation}
 * @see {@link https://marmelab.com/shadcn-admin-kit/docs/security Security documentation}
 */
export const LoginPage = (props: { redirectTo?: string }) => {
  const { darkModeLogo, title } = useConfigurationContext();
  const { redirectTo } = props;
  const [loading, setLoading] = useState(false);
  const hasDisplayedRecoveryNotification = useRef(false);
  const location = useLocation();
  const navigate = useNavigate();
  const login = useLogin();
  const notify = useNotify();
  const translate = useTranslate();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const shouldNotify = searchParams.get("passwordRecoveryEmailSent") === "1";

    if (!shouldNotify || hasDisplayedRecoveryNotification.current) {
      return;
    }

    hasDisplayedRecoveryNotification.current = true;
    notify("crm.auth.recovery_email_sent", {
      type: "success",
      messageArgs: {
        _: "If you're a registered user, you should receive a password recovery email shortly.",
      },
    });

    searchParams.delete("passwordRecoveryEmailSent");
    const nextSearch = searchParams.toString();
    navigate(
      {
        pathname: location.pathname,
        search: nextSearch ? `?${nextSearch}` : "",
      },
      { replace: true },
    );
  }, [location.pathname, location.search, navigate, notify]);

  const handleSubmit: SubmitHandler<FieldValues> = (values) => {
    setLoading(true);
    login(values, redirectTo)
      .then(() => {
        setLoading(false);
      })
      .catch((error) => {
        setLoading(false);
        const errorMessage =
          typeof error === "string"
            ? error
            : error?.message || error?.error_description || "Invalid email or password";
        notify(errorMessage, {
          type: "error",
          messageArgs: {
            _: errorMessage,
          },
        });
      });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.14),_transparent_30%),linear-gradient(180deg,_#f8fbff_0%,_#f1f5f9_100%)] p-0 lg:p-6">
      <div className="relative grid min-h-screen w-full overflow-hidden bg-card/85 shadow-[0_30px_80px_rgba(15,23,42,0.12)] lg:min-h-[calc(100vh-3rem)] lg:grid-cols-2 lg:rounded-[2rem] lg:border lg:border-border/80">
        <div className="relative hidden h-full flex-col overflow-hidden bg-[#071a33] p-10 text-white dark:border-r lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(37,99,235,0.5),_transparent_42%),linear-gradient(145deg,_#071a33_0%,_#0b2345_65%,_#12366a_100%)]" />
          <div className="relative z-20 flex flex-col gap-1">
            <div className="flex items-center text-lg font-semibold">
              <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
                <img className="h-6 w-6 object-contain" src={darkModeLogo} alt={title} />
              </div>
              {title}
            </div>
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-blue-200/70">FINLONEXA workspace</p>
          </div>
          <div className="relative z-20 mt-auto max-w-sm">
            <p className="text-4xl font-semibold leading-tight tracking-[-0.04em]">Clarity for every customer conversation.</p>
            <p className="mt-4 text-sm leading-6 text-blue-100/70">Keep teams aligned, follow-ups visible, and revenue moving from one calm workspace.</p>
          </div>
        </div>
        <div className="flex w-full flex-col justify-center p-5 sm:p-8 lg:p-12">
          <div className="mx-auto w-full max-w-sm space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-semibold tracking-tight">
                {translate("ra.auth.sign_in")}
              </h1>
            </div>
            {disableEmailPasswordAuthentication ? null : (
              <Form className="space-y-8" onSubmit={handleSubmit}>
                <TextInput
                  label="ra.auth.email"
                  source="email"
                  type="email"
                  validate={required()}
                />
                <TextInput
                  label="ra.auth.password"
                  source="password"
                  type="password"
                  validate={required()}
                />
                <div className="flex flex-col gap-4">
                  <Button
                    type="submit"
                    className="cursor-pointer"
                    disabled={loading}
                  >
                    {translate("ra.auth.sign_in")}
                  </Button>
                </div>
              </Form>
            )}
            {googleWorkplaceDomain ? (
              <SSOAuthButton className="w-full" domain={googleWorkplaceDomain}>
                {translate("crm.auth.sign_in_google_workspace", {
                  _: "Sign in with Google Workplace",
                })}
              </SSOAuthButton>
            ) : null}
            {disableEmailPasswordAuthentication ? null : (
              <Link
                to={"/forgot-password"}
                className="block text-sm text-center hover:underline"
              >
                {translate("ra-supabase.auth.forgot_password", {
                  _: "Forgot password?",
                })}
              </Link>
            )}
          </div>
        </div>
      </div>
      <Notification />
    </div>
  );
};
