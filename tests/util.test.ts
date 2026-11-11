import assert from "node:assert/strict"
import test from "node:test"
import { afterColon, isValidPort, takeArg } from "../src/utils/util"

test("afterColon 支持中英文冒号，无冒号返回空串", () => {
  assert.equal(
    afterColon("There are 2 of a max of 99 players online: a, b"),
    "a, b"
  )
  assert.equal(afterColon("在线玩家：a, b"), "a, b")
  assert.equal(afterColon("没有冒号"), "")
})

test("isValidPort 只接受 1-65535 的纯数字", () => {
  assert.equal(isValidPort("25565"), true)
  assert.equal(isValidPort("0"), false)
  assert.equal(isValidPort("65536"), false)
  assert.equal(isValidPort("25a"), false)
})

test("takeArg 支持尖括号包裹带空格的参数", () => {
  assert.deepEqual(takeArg("<生存服 A> Steve"), ["生存服 A", "Steve"])
  assert.deepEqual(takeArg("s1 Steve"), ["s1", "Steve"])
  assert.deepEqual(takeArg("<s1> say hi there"), ["s1", "say hi there"])
  assert.deepEqual(takeArg("s1 say hi there"), ["s1", "say hi there"])
  assert.deepEqual(takeArg("s1"), ["s1", ""])
  assert.deepEqual(takeArg(""), ["", ""])
})
