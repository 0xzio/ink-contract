import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers'
import { Fixture, deployFixture } from '@utils/deployFixture'
import { precision } from '@utils/precision'
import { expect } from 'chai'
import { ethers } from 'hardhat'

const GAS_PRICE = 800000000n

describe('Ink', function () {
  let f: Fixture

  beforeEach(async () => {
    f = await deployFixture()
  })

  it('Deploy', async () => {
    const supply = await f.ink.totalSupply()
    const [x, y, k] = await Promise.all([f.ink.x(), f.ink.y(), f.ink.k()])
    expect(x * y).to.equal(k)

    expect(supply).to.be.equal(0)
  })

  it('Mint with two times', async () => {
    const oneEth = precision.token(1)
    const deployerEthBalance0 = await ethers.provider.getBalance(f.deployer.address)
    const user1EthBalance0 = await ethers.provider.getBalance(f.user1.address)
    const tokenAmount0 = await f.ink.getTokenAmount(oneEth)

    expect(tokenAmount0).to.equal(await calTokenAmount(f, oneEth))

    /**
     *  mint again
     */
    const { gasEth: gasEth1 } = await mint(f, f.user1, oneEth)

    const supply1 = await f.ink.totalSupply()
    expect(supply1).to.be.equal(tokenAmount0)

    const user1EthBalance1 = await ethers.provider.getBalance(f.user1.address)
    expect(user1EthBalance0 - user1EthBalance1).to.be.equal(oneEth + gasEth1)

    const deployerEthBalance1 = await ethers.provider.getBalance(f.deployer.address)

    expect(deployerEthBalance1 - deployerEthBalance0).to.be.equal(precision.token(1))

    /**
     *  mint again
     */
    const tokenAmount1 = await f.ink.getTokenAmount(oneEth)

    expect(tokenAmount1).to.equal(await calTokenAmount(f, oneEth))

    const { gasEth: gasEth2 } = await mint(f, f.user1, oneEth)

    const deployerEthBalance2 = await ethers.provider.getBalance(f.deployer.address)

    expect(deployerEthBalance2 - deployerEthBalance1).to.be.equal(oneEth)

    const user1EthBalance2 = await ethers.provider.getBalance(f.user1.address)
    expect(user1EthBalance1 - user1EthBalance2).to.be.equal(oneEth + gasEth2)

    const supply2 = await f.ink.totalSupply()
    expect(supply2).to.be.equal(tokenAmount0 + tokenAmount1)
  })

  it('Mint with large eth amount', async () => {
    const ethAmount = precision.token(149)
    const deployerEthBalance0 = await ethers.provider.getBalance(f.deployer.address)
    const user1EthBalance0 = await ethers.provider.getBalance(f.user1.address)

    const tokenAmount0 = await f.ink.getTokenAmount(ethAmount)
    expect(tokenAmount0).to.equal(await calTokenAmount(f, ethAmount))

    const { gasEth: gasEth1 } = await mint(f, f.user1, ethAmount)

    const supply = await f.ink.totalSupply()
    expect(supply).to.be.equal(tokenAmount0)

    const user1EthBalance1 = await ethers.provider.getBalance(f.user1.address)
    expect(user1EthBalance0 - user1EthBalance1).to.be.equal(ethAmount + gasEth1)

    const deployerEthBalance1 = await ethers.provider.getBalance(f.deployer.address)

    expect(deployerEthBalance1 - deployerEthBalance0).to.be.equal(precision.token(149))
  })

  it('Should not exceed total supply', async () => {
    const ethAmount = precision.token(150)
    await expect(mint(f, f.user1, ethAmount)).to.revertedWith('Should not exceed total supply')
  })

  it('ETH amount must be greater than zero', async () => {
    await expect(mint(f, f.user1, 0n)).to.revertedWith('ETH amount must be greater than zero')
  })

  it('Mint with 1 eth step', async () => {
    const arr = Array(149)
      .fill('')
      .map((_, i) => i + 1)

    const deployerEthBalance0 = await ethers.provider.getBalance(f.deployer.address)

    for (const i of arr) {
      const deployerEthBalance0 = await ethers.provider.getBalance(f.deployer.address)
      const tokenAmount0 = await f.ink.getTokenAmount(precision.token(1))
      await mint(f, f.user1, precision.token(1))

      // console.log(
      //   i,
      //   '======tokenAmount0:',
      //   tokenAmount0,
      //   precision.decimal(tokenAmount0),
      //   `price: $${2600 / precision.decimal(tokenAmount0)}`,
      // )

      const deployerEthBalance1 = await ethers.provider.getBalance(f.deployer.address)
      expect(deployerEthBalance1 - deployerEthBalance0).to.equal(precision.token(1))
    }

    const deployerEthBalance1 = await ethers.provider.getBalance(f.deployer.address)
    expect(deployerEthBalance1 - deployerEthBalance0).to.equal(precision.token(149))
  })
})

async function calTokenAmount(f: Fixture, ethAmount: bigint) {
  const [x, y, k] = await Promise.all([f.ink.x(), f.ink.y(), f.ink.k()])
  expect(x * y).to.equal(k)
  const newX = x + ethAmount
  const newY = k / newX
  return y - newY
}

async function mint(f: Fixture, account: HardhatEthersSigner, ethAmount: bigint) {
  const tx = await f.ink.connect(account).mint({ value: ethAmount, gasPrice: GAS_PRICE })

  const receipt: any = await tx.wait()
  const gasUsed = receipt.gasUsed as bigint
  const gasEth = gasUsed * GAS_PRICE
  return { gasUsed, gasEth }
}
