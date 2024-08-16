import { Fixture, deployFixture } from '@utils/deployFixture'
import { precision } from '@utils/precision'
import { expect } from 'chai'
import { ethers } from 'hardhat'

describe.only('Ink', function () {
  let f: Fixture

  const k = precision.token(precision.token(32190005730))
  beforeEach(async () => {
    f = await deployFixture()
  })

  it('Deploy', async () => {
    const supply = await f.ink.totalSupply()
    expect(supply).to.be.equal(0)
    expect(await f.ink.k()).to.be.equal(k)
    expect(await f.ink.x()).to.be.equal(precision.token(30))
    expect(await f.ink.y()).to.be.equal(precision.token(1073000191))
  })

  it('mint() ', async () => {
    const ethBalance0 = await ethers.provider.getBalance(f.deployer.address)

    const tx1 = await f.ink.connect(f.user1).mint({ value: precision.token(1) })
    await tx1.wait()

    const supply = await f.ink.totalSupply()
    console.log('====supply:', supply, precision.toTokenDecimal(supply))

    const ethBalance1 = await ethers.provider.getBalance(f.deployer.address)
    console.log('====ethBalance1:', ethBalance1 - ethBalance0, precision.toTokenDecimal(ethBalance1 - ethBalance0))

    expect(ethBalance1 - ethBalance0).to.be.equal(precision.token(1))

    const tx2 = await f.ink.connect(f.user1).mint({ value: precision.token(2) })
    await tx2.wait()

    const ethBalance2 = await ethers.provider.getBalance(f.deployer.address)

    expect(ethBalance2 - ethBalance1).to.be.equal(precision.token(2))
  })
})
