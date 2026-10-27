import { Fragment, type ReactNode } from "react";
import { Block, parseInline, photoSrc, socialPost, videoEmbed } from "@/lib/richText";
import SocialPost from "./SocialPost";

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
        <p>
          <a href={block.url} target="_blank" rel="noopener noreferrer">
            {block.url}
          </a>
        </p>
      );
    }
    case "post": {
      const post = socialPost(block.url);
      return post ? (
        <SocialPost post={post} />
      ) : (
        <p>
          <a href={block.url} target="_blank" rel="noopener noreferrer">
            {block.url}
          </a>
        </p>
      );
    }
    case "hr":
      return <hr className="rt-hr" />;
  }
}
