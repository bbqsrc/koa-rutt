"use strict" /* eslint-disable prefer-template,no-use-before-define,no-console */

const dox = require("dox"),
      fs = require("fs"),
      path = require("path")

const toc = []

function getSource() {
  const dirname = path.resolve(__dirname, "../lib")
  const dir = fs.readdirSync(dirname)

  const out = []

  for (const fn of dir) {
    const data = fs.readFileSync(path.resolve(dirname, fn), { encoding: "utf8" })

    out.push(convertToMarkdown(data))
  }

  console.log("## API\n\n" + toc.join("\n") + "\n\n---\n\n" + out.join("\n\n---\n\n"))
}

function parseTags(segment) {
  const o = {}

  for (const tag of segment.tags) {
    if (tag.type === "param") {
      if (!o.param) {
        o.param = []
      }
      o.param.push(tag)
    } else if (tag.type === "example") {
      if (!o.example) {
        o.example = []
      }

      const re = /<caption>(.*?)<\/caption>\s*/

      if (re.test(tag.string)) {
        tag.string = tag.string.replace(re, (_, cap) => {
          tag.caption = cap
          return ""
        })
      }

      o.example.push(tag)
    } else {
      o[tag.type] = tag
    }
  }

  return o
}

function mdTitleURL(text) {
  return text.toLowerCase().replace(/ /g, "-").replace(/[^-a-z0-9]/g, "")
}

function convertToMarkdown(data) {
  const o = dox.parseComments(data, { raw: true })
  const x = []

  for (const segment of o) {
    if (segment.isPrivate || segment.tags.length === 0) {
      continue
    }

    const out = []

    const tags = parseTags(segment)

    let name

    if (tags.callback) {
      name = tags.callback.string
    } else if (tags.class) {
      name = tags.class.string
    } else if (segment) {
      name = segment.ctx.name
    } else {
      throw new TypeError(`Unknown tags: ${JSON.stringify(tags, null, 2)}`)
    }

    let outName
    const outNameParams = []
    const outParams = []

    if (segment.isClass) {
      const n = "class `" + name + "`"

      x.push("### " + n)
      toc.push("- [" + n + "](#" + mdTitleURL(n) + ")")
    } else if (tags.callback) {
      const n = "callback `" + name + "`"

      x.push("### " + n)
      toc.push("- [" + n + "](#" + mdTitleURL(n) + ")")
    }

    if (tags.param) {
      outParams.push("| Name | Type | Attributes | Description |")
      outParams.push("| ---- | ---- | ---------- | ----------- |")

      for (const param of tags.param) {
        const attrs = []

        if (param.variable) {
          attrs.push("multiple")
        }
        if (param.optional) {
          attrs.push("optional")
        }

        let desc = param.description.trim()

        if (desc.startsWith("-")) {
          desc = desc.substring(1).trim()
        }

        if (param.name.indexOf(".") === -1) {
          outNameParams.push((param.variable ? "..." : "") + param.name)
        }

        outParams.push("| " + param.name +
                " | `" + param.types.join("|") +
                "` | " + attrs.join(",") +
                " | " + desc + " |")
      }
    }

    if (segment.isClass) {
      outName = "`new " + name
    } else {
      outName = "`"

      if (segment.ctx && segment.ctx.type === "method") {
        outName += segment.ctx.cons + "#" + name
      } else if (tags.callback) {
        outName += "function* " + name
      }
    }

    outName += "(" + outNameParams.join(", ") + ")"

    if (tags.returns) {
      outName += " → {" + tags.returns.types.join("|") + "}"
    }

    outName += "`"
    toc.push("  - [" + outName + "](#" + mdTitleURL(outName) + ")")

    out.push("#### " + outName)
    out.push(segment.description.full)
    out.push(outParams.join("\n"))

    if (tags.returns) {
      out.push("**Returns:** `" + tags.returns.types.join("|") + "` " +
              tags.returns.description.replace(/\s+/g, " "))
    }

    if (tags.example) {
      for (const example of tags.example) {
        if (example.caption) {
          out.push("**Example:** " + example.caption)
        }
        out.push("```javascript\n" + example.string + "\n```")
      }
    }

    x.push(out.join("\n\n"))
  }

  return x.join("\n\n---\n\n")
}

getSource()
