export default function Background() {
  return (
    <div className="">
      <div
        style={{
          backgroundColor: "transparent",
          backgroundImage: `radial-gradient(#EDEDF0 1px, transparent 0.4px)`,
          backgroundSize: "10px 10px",
          maskImage: `
      linear-gradient(to bottom , rgba(0, 0, 0, 0.1) 20%, rgba(0, 0, 0, 1) 100%)
    `,
          WebkitMaskImage: `
      linear-gradient(to bottom, rgba(0, 0, 0, 0.1) 20%, rgba(0, 0, 0, 1) 100%)
    `,
        }}
        className="h-full w-full absolute top-0 left-0 z-10"
      ></div>
    </div>
  );
}
