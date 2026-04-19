# FAQ: Campos persistidos en el detalle de procesado

## ¿Qué entendemos como "campos persistidos" en un detalle de procesado?

En este proyecto, "campos persistidos" son los datos estructurados de un documento que ya no están solo en el OCR o en la interpretación del LLM, sino que han sido guardados como valores normalizados y asociados al documento.

Dicho de forma simple:

- El OCR extrae texto bruto.
- El LLM interpreta ese texto y propone una estructura.
- Los campos persistidos son los valores finales que el sistema conserva como datos utilizables.

## ¿Dónde se ven en la aplicación?

Se muestran en la sección "Campos persistidos" dentro del detalle procesado de documentos.

En frontend, esa sección se renderiza a partir de `selectedDocument.fieldValues`.

## ¿Qué información tiene cada campo persistido?

Cada campo persistido representa un dato concreto del documento, por ejemplo:

- proveedor
- importe total
- fecha de emisión
- número de factura
- método de pago

Además, cada registro guarda metadatos para saber:

- qué campo es
- qué valor tiene
- de dónde salió
- con qué nivel de confianza se obtuvo
- si ha sido verificado

## ¿En qué se diferencia de OCR o del resultado LLM?

La diferencia importante es esta:

- OCR: devuelve texto libre o lectura cruda del documento.
- LLM: devuelve una interpretación estructurada o semiestructurada del contenido.
- Campos persistidos: son los datos ya aterrizados al modelo de negocio de la aplicación.

Por tanto, OCR y LLM forman parte del procesamiento; los campos persistidos forman parte del resultado consolidado.

## Ejemplo práctico

Supongamos una factura.

El OCR podría devolver algo parecido a esto:

"Factura proveedor Acme. Base 100. IVA 21. Total 121."

El LLM podría interpretarlo como:

- proveedor: Acme
- base imponible: 100
- IVA: 21
- total: 121

Los campos persistidos serían ya registros concretos y reutilizables, por ejemplo:

- `vendorName = Acme`
- `subtotalAmount = 100`
- `vatAmount = 21`
- `totalAmount = 121`

Y cada uno podría quedar marcado con:

- origen: `OCR`, `LLM`, `RULE` o `MANUAL`
- confianza: `HIGH`, `MEDIUM` o `LOW`

## ¿Por qué son importantes?

Porque representan lo que el sistema considera ya consolidado y reutilizable por otras partes de la aplicación.

No son solo texto leído o interpretación narrativa: son datos preparados para consultas, trazabilidad, revisión y uso funcional dentro del producto.

## Resumen

Cuando hablamos de "campos persistidos" en el detalle de procesado, hablamos de los valores estructurados del documento que el sistema ya ha guardado de forma estable para poder trabajar con ellos después.