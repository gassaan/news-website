import { Fragment, type ReactNode } from "react";
import { Block, parseInline, photoSrc, socialPost, videoEmbed, type ChartData, type TableData } from "@/lib/richText";
import SocialPost from "./SocialPost";
import "./richData.css";

// One line of text with its bold words and links.
export function RichLine({ text }: { text: string }) {
  return (
    <>
      {parseInline(text).map((part, i) => {
        let node: ReactNode = part.text;
        if (part.href)
          node = (
            <a href={part.href} target="_blank" rel="noopener noreferrer">
              {node}
            </a>
          );
        if (part.bold) node = <strong>{node}</strong>;
        return <Fragment key={i}>{node}</Fragment>;
      })}
    </>
  );
}

// A block of article text: paragraph, sub-heading, quote, list, fact box, photo, video,
// social post or line.
export function RichBlock({ block }: { block: Block }) {
  switch (block.type) {
    case "p":
      return (
        <p>
          <RichLine text={block.text} />
        </p>
      );
    case "h":
      return (
        <h2 className="rt-h">
          <RichLine text={block.text} />
        </h2>
      );
    case "quote":
      return (
        <blockquote className="rt-quote">
          {block.lines.map((line, i) => (
            <p key={i}>
              <RichLine text={line} />
            </p>
          ))}
        </blockquote>
      );
    case "box":
      return (
        <aside className="rt-box">
          {block.lines.map((line, i) => (
            <p key={i}>
              <RichLine text={line} />
            </p>
          ))}
        </aside>
      );
    case "list": {
      const List = block.ordered ? "ol" : "ul";
      return (
        <List className="rt-list">
          {block.items.map((item, i) => (
            <li key={i}>
              <RichLine text={item} />
            </li>
          ))}
        </List>
      );
    }
    case "img":
      return (
        <figure className="rt-fig">
          {/* eslint-disable-next-line @next/next/no-img-element -- the dashboard's image service sizes it */}
          <img
            src={photoSrc(block.src, 1200)}
            srcSet={[480, 800, 1200, 1600].map((w) => `${photoSrc(block.src, w)} ${w}w`).join(", ")}
            sizes="(max-width: 720px) 92vw, 760px"
            alt={block.caption}
            loading="lazy"
          />
          {block.caption && <figcaption>{block.caption}</figcaption>}
        </figure>
      );
    case "video": {
      const embed = videoEmbed(block.url);
      return embed ? (
        <div className="rt-video">
          <iframe
            src={embed}
            title="ވީޑިއޯ"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      ) : (
        <FallbackLink url={block.url} />
      );
    }
    case "post": {
      const post = socialPost(block.url);
      return post ? (
        <SocialPost post={post} />
      ) : (
        <FallbackLink url={block.url} />
      );
    }
    case "hr":
      return <hr className="rt-hr" />;
    case "table":
      return <DataTable data={block} />;
    case "chart":
      return <DataChart data={block} />;
  }
}

// ---------- Tables and charts (made in the newsroom's Table and Chart sheets) ----------

const NUMBER = /^[+\-−]?\s?[\d.,]+\s?(%|[A-Za-z]{1,3})?$/;
const num = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });

// A table: the first row is the heading. Numbers line up in their own font; a "+" in
// front shows green and a "−" red (rises and falls).
export function DataTable({ data }: { data: TableData }) {
  const [head, ...body] = data.rows;
  const cell = (text: string) => {
    if (!NUMBER.test(text)) return undefined;
    return `n${/^\+/.test(text) ? " up" : /^[−-]\s?\d/.test(text) ? " down" : ""}`;
  };
  return (
    <figure className="rt-data">
      {data.title && <figcaption className="rt-data-title">{data.title}</figcaption>}
      <div className="rt-scroll" tabIndex={0} role="region" aria-label={data.title || "ޖަދުވަލު"}>
        <table className="rt-table">
          <thead>
            <tr>
              {head.map((c, i) => (
                <th key={i} className={i > 0 && body.length && body.every((r) => !r[i] || NUMBER.test(r[i])) ? "n" : undefined}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((r, i) => (
              <tr key={i}>
                {r.map((c, j) => (
                  <td key={j} className={cell(c)}>
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.source && <small className="rt-data-src">{data.source}</small>}
    </figure>
  );
}

const PIE = ["#a882ff", "#3e2180", "#5fd3a0", "#f0c04f", "#ff8ac4", "#7cc9ff", "#ffa766", "#c9b6f5", "#6b4fbb", "#2fae7c", "#d99a1e", "#9aa3b5"];

// A chart: sideways bars, columns, or a circle of shares. The biggest value stands out.
export function DataChart({ data }: { data: ChartData }) {
  const max = Math.max(...data.items.map((i) => i.value), 0) || 1;
  const top = data.items.findIndex((i) => i.value === max);
  const total = data.items.reduce((n, i) => n + i.value, 0) || 1;
  const share = (v: number) => {
    const p = (v / total) * 100;
    return `${p < 10 && p % 1 ? p.toFixed(1) : Math.round(p)}%`;
  };
  // Where each slice of the circle starts (out of 100).
  const starts = data.items.map((_, k) => data.items.slice(0, k).reduce((n, i) => n + (i.value / total) * 100, 0));
  return (
    <figure className={`rt-data rt-chart rt-${data.kind}`}>
      {data.title && <figcaption className="rt-data-title">{data.title}</figcaption>}
      {data.kind === "bar" && (
        <div className="rc-bars">
          {data.items.map((i, k) => (
            <div key={k} className={`rc-bar${k === top ? " top" : ""}`}>
              <span className="rc-label">{i.label}</span>
              <span className="rc-track">
                <span className="rc-lane">
                  <span className="rc-fill" style={{ width: `${Math.max(4, (i.value / max) * 100)}%` }} />
                </span>
                <span className="rc-val">{num(i.value)}</span>
              </span>
            </div>
          ))}
        </div>
      )}
      {data.kind === "col" && (
        <div className="rc-cols">
          {data.items.map((i, k) => (
            <div key={k} className={`rc-col${k === top ? " top" : ""}`}>
              <span className="rc-room">
                <span className="rc-val">{num(i.value)}</span>
                <span className="rc-pillar" style={{ ["--h" as string]: Math.max(0.03, i.value / max) }} />
              </span>
              <span className="rc-label">{i.label}</span>
            </div>
          ))}
        </div>
      )}
      {data.kind === "pie" && (
        <div className="rc-pie">
          <svg viewBox="0 0 120 120" role="img" aria-label={data.items.map((i) => `${i.label} ${share(i.value)}`).join("، ")}>
            {data.items.map((i, k) => {
              const len = (i.value / total) * 100;
              return (
                <circle
                  key={k}
                  r="42"
                  cx="60"
                  cy="60"
                  fill="none"
                  stroke={PIE[k % PIE.length]}
                  strokeWidth="22"
                  pathLength="100"
                  strokeDasharray={`${len} ${100 - len}`}
                  strokeDashoffset={-starts[k]}
                  transform="rotate(-90 60 60)"
                />
              );
            })}
          </svg>
          <ul>
            {data.items.map((i, k) => (
              <li key={k}>
                <i style={{ background: PIE[k % PIE.length] }} />
                <span>{i.label}</span>
                <b>{share(i.value)}</b>
              </li>
            ))}
          </ul>
        </div>
      )}
      {data.source && <small className="rt-data-src">{data.source}</small>}
    </figure>
  );
}

// A video or post link that can't be shown as one: a plain link, but only to a web
// address (http/https); anything else (javascript:, data:…) stays as text.
function FallbackLink({ url }: { url: string }) {
  return (
    <p>
      {/^https?:\/\//i.test(url) ? (
        <a href={url} target="_blank" rel="noopener noreferrer">
          {url}
        </a>
      ) : (
        url
      )}
    </p>
  );
}
