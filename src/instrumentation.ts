import { NodeSDK } from '@opentelemetry/sdk-node'
import { Resource } from '@opentelemetry/resources'
import { ConsoleMetricExporter, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'yourServiceName',
    [SemanticResourceAttributes.SERVICE_VERSION]: '1.0',
  }),
  traceExporter: new ConsoleSpanExporter(),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new ConsoleMetricExporter(),
  }),
})

sdk.start()

// /*instrumentation.ts*/
// import { NodeSDK } from '@opentelemetry/sdk-node'
// import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node'
// // import { ConsoleMetricExporter, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
// import { Resource } from '@opentelemetry/resources'
// import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'
// import { BasicTracerProvider, BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'
// // import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'

// // import { WebTracerProvider } from '@opentelemetry/sdk-trace-web'

// // const resource = Resource.default().merge(
// //   new Resource({
// //     [SemanticResourceAttributes.SERVICE_NAME]: 'o11y-stale-branch-poc',
// //     [SemanticResourceAttributes.SERVICE_VERSION]: '0.1.0',
// //   }),
// // )

// // const provider = new WebTracerProvider({
// //   resource: resource,
// // })
// // const exporter = new ConsoleSpanExporter()
// // const processor = new BatchSpanProcessor(exporter)
// // provider.addSpanProcessor(processor)

// // provider.register()

// const resource = new Resource({
//   [SemanticResourceAttributes.SERVICE_NAME]: 'o11y-stale-branch-poc',
//   [SemanticResourceAttributes.SERVICE_VERSION]: '0.1.0',
// })

// const sdk = new NodeSDK({
//   resource: resource,
//   traceExporter: new ConsoleSpanExporter(),
// })

// sdk.start()

// const provider = new BasicTracerProvider({
//   resource: resource,
// })

// provider.addSpanProcessor(new BatchSpanProcessor(new ConsoleSpanExporter()))
// provider.register()
