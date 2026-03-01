import { TOOLS } from "@/tools/registry";
import { TOOL_MODULES } from "@/tools/modules";

export const metadata = {
  title: "Tool Inventory | TPPC Tools"
};

export default function ToolInventoryPage() {
  const moduleBySlug = new Map(TOOL_MODULES.map((mod) => [mod.slug, mod]));
  const totals = {
    tools: TOOLS.length,
    aliases: TOOLS.reduce((sum, tool) => sum + tool.routeAliases.length, 0)
  };

  return (
    <section className="surface" style={{ padding: "1rem" }}>
      <h1 className="page-title">Tool Inventory</h1>
      <p className="page-subtitle">
        Internal reference for registered tool routes and module wiring.
      </p>

      <div className="surface-strong mt-3" style={{ padding: "0.8rem", borderRadius: "0.75rem" }}>
        <div>
          <strong>Total tools:</strong> {totals.tools}
        </div>
        <div>
          <strong>Total route aliases:</strong> {totals.aliases}
        </div>
      </div>

      <div className="table-responsive mt-3">
        <table className="table align-middle">
          <thead>
            <tr>
              <th scope="col">Tool</th>
              <th scope="col">Slug</th>
              <th scope="col">Route</th>
              <th scope="col">Status</th>
              <th scope="col">Module</th>
              <th scope="col">Route Aliases</th>
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
                  <td>{tool.status}</td>
                  <td>{mod ? "present" : "missing"}</td>
                  <td>
                    {tool.routeAliases.length
                      ? tool.routeAliases.map((p) => <code key={p}>{p} </code>)
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
