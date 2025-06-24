import { Hyperliquid } from "hyperliquid";

const sdk = new Hyperliquid({})

export const fetchPortfolio = async (user: string) => {
  const allMids = await sdk.info.getAllMids();
  const clearinghouseState = await sdk.info.perpetuals.getClearinghouseState(user);
  const spotBalances = await sdk.info.spot.getSpotClearinghouseState(user);
  const delegations = await sdk.info.getDelegations(user);

  const delegationsBalance = delegations.reduce((acc, delegation) => acc + Number(delegation.amount), 0);
  const spotMid = Number(allMids["HYPE-SPOT"]);
  const perpMid = Number(allMids["HYPE-PERP"]);
  const hypePerpPosition = clearinghouseState.assetPositions.find((p) => p.position.coin === "HYPE-PERP")?.position;
  const hypeSpotBalance = Number(spotBalances.balances.find((b) => b.coin === "HYPE-SPOT")?.total || 0);
  const hypePerpBalance = Number(hypePerpPosition?.szi || 0);
  const usdcSpotBalance = Number(spotBalances.balances.find((b) => b.coin === "USDC-SPOT")?.total || 0);
  const usdcPerpWithdrawableBalance = Number(clearinghouseState.withdrawable || 0);
  const usdcWithdrawableBalance = usdcSpotBalance + usdcPerpWithdrawableBalance;
  const perpAccountValue = Number(clearinghouseState.marginSummary.accountValue || 0);
  const cumFunding = Number(hypePerpPosition?.cumFunding.allTime || 0);

  const data = {
    spotMid,
    perpMid,
    hypeSpotBalance,
    hypePerpBalance,
    usdcSpotBalance,
    perpAccountValue,
    cumFunding,
    usdcWithdrawableBalance,
    accountValue: ((hypeSpotBalance + delegationsBalance) * spotMid) + usdcSpotBalance + perpAccountValue,
    stakingDelegations: delegations,
  }
  return data;
};