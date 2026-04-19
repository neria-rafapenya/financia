interface PageHeroProps {
  title: string;
  description: string;
  meta?: string;
}

export function PageHero({
  title,
  description,
  meta,
}: Readonly<PageHeroProps>) {
  return (
    <section className="page-hero  border-0  ps-3 pe-3 pt-2 pb-1 overflow-hidden">
      {/* {meta ? <span className="page-hero__meta">{meta}</span> : null} */}
      <h3>{title}</h3>
      {/* <p className=" mb-0">{description}</p> */}
    </section>
  );
}
