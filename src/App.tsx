import { CRM } from "@/components/atomic-crm/root/CRM";
import { getMissingSupabaseEnvironmentVariables } from "@/components/atomic-crm/providers/supabase/supabase";

/**
 * Application entry point
 *
 * Customize Atomic CRM by passing props to the CRM component:
 *  - companySectors
 *  - darkTheme
 *  - dealCategories
 *  - dealPipelineStatuses
 *  - dealStages
 *  - lightTheme
 *  - darkModeLogo / lightModeLogo
 *  - noteStatuses
 *  - taskTypes
 *  - title
 * ... as well as all the props accepted by shadcn-admin-kit's <Admin> component.
 *
 * Logos must be an imported asset, an absolute URL, or a data URI — never a
 * route-relative path like "./img/logo.png", which breaks on nested routes.
 *
 * @example
 * import logoDark from "./logo-dark.svg";
 * import logoLight from "./logo-light.svg";
 *
 * const App = () => (
 *    <CRM
 *       darkModeLogo={logoDark}
 *       lightModeLogo={logoLight}
 *       title="Acme CRM"
 *    />
 * );
 */
const App = () => {
  const missingEnvironmentVariables = getMissingSupabaseEnvironmentVariables();

  if (missingEnvironmentVariables.length > 0) {
    return (
      <main
        className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-4 px-6"
        role="alert"
      >
        <h1 className="text-2xl font-semibold">
          FINLONEXA CRM configuration required
        </h1>
        <p>Set these environment variables in the deployment settings:</p>
        <ul className="list-disc pl-6">
          {missingEnvironmentVariables.map((variable) => (
            <li key={variable}>
              <code>{variable}</code>
            </li>
          ))}
        </ul>
      </main>
    );
  }

  return <CRM />;
};

export default App;
