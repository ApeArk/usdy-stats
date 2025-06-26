import { Hyperliquid } from "hyperliquid";

const sdk = new Hyperliquid({})

const getFundingHistory = async (user: string, startTime: Date) => {
  let funding = 0

  let lastTime = startTime.getTime();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const fundingHistory = await sdk.info.perpetuals.getUserFunding(user, lastTime);
    if (fundingHistory.length === 0) {
      break;
    }
    
    funding += fundingHistory.reduce((acc, entry) => acc + Number(entry.delta.usdc), 0);
    lastTime = fundingHistory[fundingHistory.length - 1].time;
    if (fundingHistory.length < 500) {
      break;
    }
  }

  return funding;
}

export const fetchPortfolio = async (user: string) => {
  const allMids = await sdk.info.getAllMids();
  const clearinghouseState = await sdk.info.perpetuals.getClearinghouseState(user);
  const spotBalances = await sdk.info.spot.getSpotClearinghouseState(user);
  const delegations = await sdk.info.getDelegations(user);

  const startTime7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const cumFunding7d = await getFundingHistory(user, startTime7d);

  const startTime30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const cumFunding30d = await getFundingHistory(user, startTime30d);

  const delegationsBalance = delegations.reduce((acc, delegation) => acc + Number(delegation.amount), 0);
  const spotMid = Number(allMids["HYPE-SPOT"]);
  const perpMid = Number(allMids["HYPE-PERP"]);
  const hypePerpPosition = clearinghouseState.assetPositions.find((p) => p.position.coin === "HYPE-PERP")?.position;
  const hypeSpotBalance = Number(spotBalances.balances.find((b) => b.coin === "HYPE-SPOT")?.total || 0);
  const hypePerpBalance = Number(hypePerpPosition?.szi || 0);
  const usdcSpotBalance = Number(spotBalances.balances.find((b) => b.coin === "USDC-SPOT")?.total || 0);
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
    cumFunding7d,
    cumFunding30d,
    accountValue: ((hypeSpotBalance + delegationsBalance) * spotMid) + usdcSpotBalance + perpAccountValue,
    stakingDelegations: delegations,
  }
  return data;
};