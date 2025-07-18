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

const getPortfolio = async (user: string) => {
  const portfolio = await sdk.info.portfolio(user);
  const avg7d = portfolio[1][1].accountValueHistory.reduce((acc, entry) => acc + Number(entry[1]), 0) / portfolio[1][1].accountValueHistory.length;
  const avg30d = portfolio[2][1].accountValueHistory.reduce((acc, entry) => acc + Number(entry[1]), 0) / portfolio[2][1].accountValueHistory.length;
  return {
    avg7d,
    avg30d,
  }
}

export const fetchPortfolio = async (user: string) => {
  const allMids = await sdk.info.getAllMids();
  const clearinghouseState = await sdk.info.perpetuals.getClearinghouseState(user);
  const spotBalances = await sdk.info.spot.getSpotClearinghouseState(user);
  const delegations = await sdk.info.getDelegations(user);
  const portfolio = await getPortfolio(user);

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
  const perpWithdrawable = Number(clearinghouseState.withdrawable || 0);
  const cumFunding = -Number(hypePerpPosition?.cumFunding.allTime || 0);
  const avg7d = portfolio.avg7d;
  const avg30d = portfolio.avg30d;
  const apr7d = cumFunding7d / avg7d / 7 * 365 * 100;
  const apr30d = cumFunding30d / avg30d / 30 * 365 * 100;
  const accountValue = ((hypeSpotBalance + delegationsBalance) * spotMid) + usdcSpotBalance + perpAccountValue;

  const data = {
    spotMid,
    perpMid,
    hypeSpotBalance,
    hypePerpBalance,
    usdcSpotBalance,
    perpAccountValue,
    usdcTotalBalance: usdcSpotBalance + perpWithdrawable,
    cumFunding,
    cumFunding7d,
    cumFunding30d,
    avg7d,
    avg30d,
    apr7d,
    apr30d,
    accountValue,
    stakingDelegations: delegations,
    lastUpdatedAt: new Date().getTime(),
  }
  return data;
};