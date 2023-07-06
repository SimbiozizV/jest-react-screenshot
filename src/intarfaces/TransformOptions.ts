export interface TransformOptions<TransformerConfig = unknown> {
    supportsDynamicImport: boolean;
    supportsExportNamespaceFrom: boolean;
    supportsStaticESM: boolean;
    supportsTopLevelAwait: boolean;
    instrument: boolean;
    cacheFS: Map<string, string>;
    config: unknown;
    configString: string;
    transformerConfig: TransformerConfig;
}
