import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useDataProvider, useLogin, useNotify, useTranslate } from "ra-core";
import { useForm, type SubmitHandler } from "react-hook-form";
import { Link, Navigate, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { CrmDataProvider } from "../providers/types";
import type { SignUpData } from "../types";
import { LoginSkeleton } from "./LoginSkeleton";
import { Notification } from "@/components/admin/notification";
import { ConfirmationRequired } from "./ConfirmationRequired";
import { SSOAuthButton } from "./SSOAuthButton";
import { googleWorkplaceDomain } from "./authConfig";

export const SignupPage = () => {
  const queryClient = useQueryClient();
  const dataProvider = useDataProvider<
    CrmDataProvider & { signUp: (data: SignUpData) => Promise<SignUpData> }
  >();
  const navigate = useNavigate();
  const translate = useTranslate();
  const { data: isInitialized, isPending } = useQuery({
    queryKey: ["init"],
    queryFn: async () => {
      return dataProvider.isInitialized();
    },
  });

  const { isPending: isSignUpPending, mutate } = useMutation({
    mutationKey: ["signup"],
    mutationFn: async (data: SignUpData) => {
      return dataProvider.signUp(data);
    },
    onSuccess: (data) => {
      login({
        email: data.email,
        password: data.password,
        redirectTo: "/contacts",
      })
        .then(() => {
          notify("crm.auth.signup.initial_user_created", {
            messageArgs: {
              _: "Initial user successfully created",
            },
          });
          // FIXME: We should probably provide a hook for that in the ra-core package
          queryClient.invalidateQueries({
            queryKey: ["auth", "canAccess"],
          });
        })
        .catch((err) => {
          if (err.code === "email_not_confirmed") {
            // An email confirmation is required to continue.
            navigate(ConfirmationRequired.path);
          } else {
            notify("crm.auth.sign_in_failed", {
              type: "error",
              messageArgs: {
                _: "Failed to log in.",
              },
            });
            navigate("/login");
          }
        });
    },
    onError: (error) => {
      notify(error.message);
    },
  });

  const login = useLogin();
  const notify = useNotify();

  const {
    register,
    handleSubmit,
    formState: { isValid },
  } = useForm<SignUpData>({
    mode: "onChange",
  });

  if (isPending) {
    return <LoginSkeleton />;
  }

  // For the moment, we only allow one user to sign up. Other users must be created by the administrator.
  if (isInitialized) {
    return <Navigate to="/login" />;
  }

  const onSubmit: SubmitHandler<SignUpData> = async (data) => {
    mutate(data);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.14),_transparent_30%),linear-gradient(180deg,_#f8fbff_0%,_#f1f5f9_100%)] p-5 sm:p-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
          <span className="text-sm font-bold">F</span>
        </div>
        <div className="flex flex-col">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary/80">FINLONEXA</p>
          <h1 className="text-xl font-semibold tracking-[-0.03em]">CRM</h1>
        </div>
      </div>
      <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-xl items-center justify-center">
        <div className="w-full space-y-5 rounded-[2rem] border border-border/80 bg-card/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.1)] sm:p-9">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/80">Workspace setup</p>
            <h1 className="mt-2 text-2xl font-bold tracking-[-0.03em]">
            {translate("crm.auth.welcome_title", {
              _: "Welcome to CRM",
            })}
            </h1>
          </div>
          <p className="mb-4 text-base text-muted-foreground">
            {translate("crm.auth.signup.create_first_user", {
              _: "Create the first user account to complete the setup.",
            })}
          </p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="first_name">
                {translate("crm.auth.first_name")}
              </Label>
              <Input
                {...register("first_name", { required: true })}
                id="first_name"
                type="text"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="last_name">
                {translate("crm.auth.last_name")}
              </Label>
              <Input
                {...register("last_name", { required: true })}
                id="last_name"
                type="text"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">{translate("ra.auth.email")}</Label>
              <Input
                {...register("email", { required: true })}
                id="email"
                type="email"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">{translate("ra.auth.password")}</Label>
              <Input
                {...register("password", { required: true })}
                id="password"
                type="password"
                required
              />
            </div>
            <div className="flex flex-col gap-4 justify-between items-center mt-8">
              <Button
                type="submit"
                disabled={!isValid || isSignUpPending}
                className="w-full"
              >
                {isSignUpPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    {translate("crm.auth.signup.creating", {
                      _: "Creating...",
                    })}
                  </>
                ) : (
                  translate("crm.auth.signup.create_account", {
                    _: "Create account",
                  })
                )}
              </Button>
              {googleWorkplaceDomain ? (
                <SSOAuthButton
                  className="w-full"
                  domain={googleWorkplaceDomain}
                >
                  {translate("crm.auth.sign_in_google_workspace", {
                    _: "Sign in with Google Workplace",
                  })}
                </SSOAuthButton>
              ) : null}
              <Button
                type="button"
                variant="outline"
                className="w-full cursor-pointer"
                onClick={() => navigate("/login")}
              >
                {translate("ra.auth.sign_in", {
                  _: "Already have an account? Log in",
                })}
              </Button>
              <Link
                to="/login"
                className="block text-sm text-center hover:underline pt-2"
              >
                {translate("ra.auth.sign_in", {
                  _: "Already have an account? Log in",
                })}
              </Link>
            </div>
          </form>
        </div>
      </div>
      <Notification />
    </div>
  );
};

SignupPage.path = "/sign-up";
