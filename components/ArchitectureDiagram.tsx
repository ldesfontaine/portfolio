type DiagramNode = {
  id: string;
  label: string;
  detail?: string;
  tone?: "default" | "mauve" | "orange";
};

type DiagramLink = {
  from: string;
  to: string;
  label?: string;
};

type DiagramData = {
  nodes: DiagramNode[];
  links: DiagramLink[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const readDiagram = (value: unknown): DiagramData | null => {
  if (!isRecord(value) || !Array.isArray(value.nodes) || !Array.isArray(value.links)) {
    return null;
  }

  const nodes = value.nodes.filter((node): node is DiagramNode => {
    if (!isRecord(node) || typeof node.id !== "string" || typeof node.label !== "string") {
      return false;
    }
    if (node.detail != null && typeof node.detail !== "string") return false;
    if (
      node.tone != null &&
      node.tone !== "default" &&
      node.tone !== "mauve" &&
      node.tone !== "orange"
    ) {
      return false;
    }
    return true;
  });
  const links = value.links.filter((link): link is DiagramLink => {
    if (!isRecord(link) || typeof link.from !== "string" || typeof link.to !== "string") {
      return false;
    }
    return link.label == null || typeof link.label === "string";
  });

  if (nodes.length !== value.nodes.length || links.length !== value.links.length) return null;
  return { nodes, links };
};

export default function ArchitectureDiagram({
  title,
  data,
  caption,
}: {
  title?: string | null;
  data: unknown;
  caption?: string | null;
}) {
  const diagram = readDiagram(data);
  if (!diagram) return null;
  const byId = new Map(diagram.nodes.map((node) => [node.id, node]));

  return (
    <figure className="architecture-diagram">
      {title ? <h3>{title}</h3> : null}
      <div className="architecture-nodes">
        {diagram.nodes.map((node) => (
          <div key={node.id} className="architecture-node" data-tone={node.tone ?? "default"}>
            <span>{node.id}</span>
            <strong>{node.label}</strong>
            {node.detail ? <small>{node.detail}</small> : null}
          </div>
        ))}
      </div>
      {diagram.links.length > 0 ? (
        <div className="architecture-links" aria-label="Relations">
          {diagram.links.map((link, index) => (
            <div key={`${link.from}-${link.to}-${index}`}>
              <span>{byId.get(link.from)?.label ?? link.from}</span>
              <i>→</i>
              <span>{byId.get(link.to)?.label ?? link.to}</span>
              {link.label ? <small>{link.label}</small> : null}
            </div>
          ))}
        </div>
      ) : null}
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}
