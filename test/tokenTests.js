'use strict';

let POLYToken = artifacts.require('PolyMathToken.sol');
const BigNumber = require("bignumber.js");
const assertFail = require("./helpers/assertFail");

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

const expect = require('chai').expect

let polyToken, watcher;

let initialSupply = new web3.BigNumber(1000 * Math.pow(6, 18));

contract('polyToken', async function(accounts) {
  beforeEach(async () => {
    polyToken = await POLYToken.new(accounts[5]);
  });

  it('owner should be able to burn tokens', async function () {
      await polyToken.transfer(accounts[1], 1, {
        from: accounts[0]
      });
      let balance = (await polyToken.balanceOf(accounts[1])).toNumber();
      balance.should.be.bignumber.equal(1);

      const { logs } = await polyToken.burn(1, { from: accounts[1] });

      balance = (await polyToken.balanceOf(accounts[1])).toNumber();
      balance.should.be.bignumber.equal(0);

      const event = logs.find(e => e.event === 'Burn');
      expect(event).to.exist;
  });

  it('ONLY owner should be able to burn tokens', async function () {
      await polyToken.transfer(accounts[1], 1, {
        from: accounts[0]
      });

      let balance = (await polyToken.balanceOf(accounts[1])).toNumber()
      balance.should.be.bignumber.equal(1);

      await assertFail(async () => { await polyToken.burn(1, { from: accounts[2] }) });

      balance = (await polyToken.balanceOf(accounts[1])).toNumber()
      balance.should.be.bignumber.equal(1);

      const { logs } = await polyToken.burn(1, { from: accounts[1] });

      balance = (await polyToken.balanceOf(accounts[1])).toNumber()
      balance.should.be.bignumber.equal(0);

      const event = logs.find(e => e.event === 'Burn')
      expect(event).to.exist
  });

  it('cannot burn more tokens than your balance', async function () {
     await assertFail(async () => { await polyToken.burn(2000, { from: accounts[1] }) });
  });

  it('the fallback function should revert unknown functions', async () => {
    await assertFail(async () => { await web3.eth.sendTransaction({
        'from': accounts[0],
        'to': polyToken.address
      })
    });
  });

  it('should have 1 billion totalSupply', async () => {
    let totalSupply = await polyToken.totalSupply.call();
    assert.equal(totalSupply, 1000000000000000000000000000, "totalSupply was incorrect");
  });

  it('should have correct name', async () => {;
    assert.equal(await polyToken.name.call(), "PolyMathToken", "name was incorrect");
  });

  it('should have correct symbol', async () => {
    assert.equal(await polyToken.symbol.call(), "POLY", "symbol was incorrect");
  });

  it('should have correct number of decimals', async () => {
      assert.equal(await polyToken.decimals.call(), 18, "decimals was incorrect");
  });

  // ############## ERC20 TESTS ##############

  let amount = new web3.BigNumber(850000000000000000000000000);
  // TRANSERS
  it("transfers: should transfer 850000000 to accounts[1] with accounts[0] having 850000000", async () => {
    watcher = polyToken.Transfer();
    await polyToken.transfer(accounts[1], amount, {
      from: accounts[0]
    });
    let logs = watcher.get();
    assert.equal(logs[0].event, "Transfer");
    assert.equal(logs[0].args.from, accounts[0]);
    assert.equal(logs[0].args.to, accounts[1]);
    assert.equal(logs[0].args.value.toNumber(), amount);
    assert.equal((await polyToken.balanceOf.call(accounts[0])).toNumber(), 0);
    assert.equal(
      (await polyToken.balanceOf.call(accounts[1])).toNumber(),
      amount
    );
  });

  it("transfers: should fail when trying to transfer 850000010 to accounts[1] with accounts[0] having 850000000", async () => {
    await assertFail(async () => {
      await polyToken.transfer(accounts[1], amount + 10, {
        from: accounts[0]
      });
    });
    assert.equal(
      (await polyToken.balanceOf.call(accounts[0])).toNumber(),
      amount
    );
  });

  // APPROVALS
  it("approvals: msg.sender should approve 100 to accounts[1]", async () => {
    watcher = polyToken.Approval();
    await polyToken.approve(accounts[1], 100, { from: accounts[0] });
    let logs = watcher.get();
    assert.equal(logs[0].event, "Approval");
    assert.equal(logs[0].args.owner, accounts[0]);
    assert.equal(logs[0].args.spender, accounts[1]);
    assert.strictEqual(logs[0].args.value.toNumber(), 100);

    assert.strictEqual(
      (await polyToken.allowance.call(accounts[0], accounts[1])).toNumber(),
      100
    );
  });

  it("approvals: msg.sender approves accounts[1] of 100 & withdraws 20 once.", async () => {
    watcher = polyToken.Transfer();
    await polyToken.approve(accounts[1], 100, { from: accounts[0] });

    assert.strictEqual(
      (await polyToken.balanceOf.call(accounts[2])).toNumber(),
      0
    );
    await polyToken.transferFrom(accounts[0], accounts[2], 20, {
      from: accounts[1]
    });

    var logs = watcher.get();
    assert.equal(logs[0].event, "Transfer");
    assert.equal(logs[0].args.from, accounts[0]);
    assert.equal(logs[0].args.to, accounts[2]);
    assert.strictEqual(logs[0].args.value.toNumber(), 20);

    assert.strictEqual(
      (await polyToken.allowance.call(accounts[0], accounts[1])).toNumber(),
      80
    );

    assert.strictEqual(
      (await polyToken.balanceOf.call(accounts[2])).toNumber(),
      20
    );
    await polyToken.balanceOf.call(accounts[0]);
    assert.equal(
      (await polyToken.balanceOf.call(accounts[0])).toNumber(),
      amount - 40
    );
  });

  it("approvals: msg.sender approves accounts[1] of 100 & withdraws 20 twice.", async () => {
    await polyToken.approve(accounts[1], 100, { from: accounts[0] });
    await polyToken.transferFrom(accounts[0], accounts[2], 20, {
      from: accounts[1]
    });
    await polyToken.transferFrom(accounts[0], accounts[2], 20, {
      from: accounts[1]
    });
    await polyToken.allowance.call(accounts[0], accounts[1]);

    assert.strictEqual(
      (await polyToken.allowance.call(accounts[0], accounts[1])).toNumber(),
      60
    );

    assert.strictEqual(
      (await polyToken.balanceOf.call(accounts[2])).toNumber(),
      40
    );

    assert.equal(
      (await polyToken.balanceOf.call(accounts[0])).toNumber(),
      amount - 40
    );
  });

  //should approve 100 of msg.sender & withdraw 50 & 60 (should fail).
  it("approvals: msg.sender approves accounts[1] of 100 & withdraws 50 & 60 (2nd tx should fail)", async () => {
    await polyToken.approve(accounts[1], 100, { from: accounts[0] });
    await polyToken.transferFrom(accounts[0], accounts[2], 50, {
      from: accounts[1]
    });
    assert.strictEqual(
      (await polyToken.allowance.call(accounts[0], accounts[1])).toNumber(),
      50
    );

    assert.strictEqual(
      (await polyToken.balanceOf.call(accounts[2])).toNumber(),
      50
    );

    assert.equal(
      (await polyToken.balanceOf.call(accounts[0])).toNumber(),
      amount - 50
    );
    await assertFail(async () => {
      await polyToken.transferFrom.call(accounts[0], accounts[2], 60, {
        from: accounts[1]
      });
    });

    assert.strictEqual(
      (await polyToken.balanceOf.call(accounts[2])).toNumber(),
      50
    );
    assert.equal(
      (await polyToken.balanceOf.call(accounts[0])).toNumber(),
      amount - 50
    );
  });

  it("approvals: attempt withdrawal from account with no allowance (should fail)", async () => {
    await assertFail(async () => {
      await polyToken.transferFrom.call(accounts[0], accounts[2], 60, {
        from: accounts[1]
      });
    });
    assert.equal(
      (await polyToken.balanceOf.call(accounts[0])).toNumber(),
      amount
    );
  });

  it("approvals: allow accounts[1] 100 to withdraw from accounts[0]. Withdraw 60 and then approve 0 & attempt transfer.", async () => {
    await polyToken.approve(accounts[1], 100, { from: accounts[0] });
    await polyToken.transferFrom(accounts[0], accounts[2], 60, {
      from: accounts[1]
    });
    await polyToken.approve(accounts[1], 0, { from: accounts[0] });
    await assertFail(async () => {
      await polyToken.transferFrom.call(accounts[0], accounts[2], 10, {
        from: accounts[1]
      });
    });
    assert.equal(
      (await polyToken.balanceOf.call(accounts[0])).toNumber(),
      amount - 60
    );
  })
});
