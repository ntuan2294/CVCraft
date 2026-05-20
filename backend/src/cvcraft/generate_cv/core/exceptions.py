class CVCraftError(Exception):
    pass


class PipelineError(CVCraftError):
    pass


class ConfigurationError(CVCraftError):
    pass


class RAGError(CVCraftError):
    pass
