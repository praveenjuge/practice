// Metro resolves image imports to a numeric asset ID.
declare module "*.png" {
  const source: number;
  export default source;
}
