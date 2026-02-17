import { TOOLS } from "@/tools/registry";
import { TOOL_MODULES } from "@/tools/modules";

export const metadata = {
  title: "Migration Dashboard | TPPC Tools"
};

export default function MigrationDashboardPage() {
  const moduleBySlug = new Map(TOOL_MODULES.map((mod) => [mod.slug, mod]));
  const totals = {
    native: TOOLS.filter((t) => t.implementation === "native").length,
    legacy: TOOLS.filter((t) => t.implementation === "legacy").length
  };

  return (
    <section className="panel">
      <h1 className="page-title">Migration Dashboard</h1>
      <p className="page-subtitle">
        Internal tracker for the native migration rollout.
      </p>

      <div className="panel-muted p-3 mt-3">
        <div>
          <strong>Total tools:</strong> {TOOLS.length}
        </div>
        <div>
          <strong>Native:</strong> {totals.native}
        </div>
        <div>
          <strong>Legacy:</strong> {totals.legacy}
        </div>
      </div>

      <div className="table-responsive mt-3">
        <table className="table table-sm align-middle">
          <thead>
            <tr>
              <th scope="col">Tool</th>
              <th scope="col">Slug</th>
              <th scope="col">Route</th>
              <th scope="col">Implementation</th>
              <th scope="col">Status</th>
              <th scope="col">Module</th>
              <th scope="col">Legacy Redirects</th>
            </tr>
          </thead>
          <tbody>
            {TOOLS.map((tool) => {
              const mod = moduleBySlug.get(tool.slug);
              return (
                <tr key={tool.slug}>
                  <td>{tool.name}</td>
                  <td>
                    <code>{tool.slug}</code>
                  </td>
                  <td>
                    <code>{tool.route}</code>
                  </td>
                  <td>{tool.implementation}</td>
                  <td>{tool.status}</td>
                  <td>{mod ? "present" : "missing"}</td>
                  <td>
                    {tool.legacyRedirects.length
                      ? tool.legacyRedirects.map((p) => <code key={p}>{p} </code>)
                      : <span className="text-muted">none</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

