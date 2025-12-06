import { DareItem, DareStateBackendResponse, BackendDareState } from "@/types";

/**
 * Maps backend dare state response to DareItem format used in frontend
 * Extracts needed fields and converts data types as necessary
 *
 * @param backendResponse - The response from backend /api/admin/dares/state/:dareMint
 * @returns DareItem object compatible with frontend components
 */
export const mapBackendDareStateToItem = (
  backendResponse: DareStateBackendResponse
): DareItem => {
  const { dareState, submissions } = backendResponse;

  // Convert backend dare state to DareItem
  const dareItem: DareItem = {
    tokenMint: dareState.tokenMint,
    creator: dareState.creator,
    dareStatus: dareState.dareStatus,
    tradeStatus: dareState.tradeStatus,
    payout: dareState.payoutAmount,
    openTimestamp: parseInt(dareState.openTimestamp),
    openDuration: parseInt(dareState.openDuration),
    isBlocked: dareState.isBlocked,
    isDisabled: dareState.dbDare.isDisabled,
    submitters: dareState.submitters,
    ipfsCid: dareState.dbDare.ipfsCid,
    submissions: submissions,
    isTokenless: dareState.isTokenless,
    dareStatePublicKey: dareState.isTokenless ? dareState.tokenMint : undefined,
    isFeatured: dareState.dbDare.isFeatured,
  };

  return dareItem;
};

/**
 * Extract only the essential fields from backend dare state
 * Useful for partial updates without full object construction
 *
 * @param dareState - Backend dare state object
 * @returns Object with essential dare fields
 */
export const extractEssentialDareFields = (dareState: BackendDareState) => {
  return {
    dareStatus: dareState.dareStatus,
    submitters: dareState.submitters,
    isBlocked: dareState.isBlocked,
    isFeatured: dareState.dbDare.isFeatured,
    isDisabled: dareState.dbDare.isDisabled,
    openTimestamp: parseInt(dareState.openTimestamp),
    openDuration: parseInt(dareState.openDuration),
  };
};
