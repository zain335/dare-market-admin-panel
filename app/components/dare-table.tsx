"use client";
import { DareTableColumns } from "@/constants/table-columns/Dare";
import { DareStatusFilter, SubmissionStatusFilter } from "@/constants";
import { DareItem } from "@/types";
import axios from "axios";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import DareInfoForm from "./dare-info-form";
import { DataTable } from "./data-table";
import { useToast } from "./shadcn/ui/use-toast";
import { SlidingSheet } from "./sliding-sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/ui/select";
import { prefetchIPFSMetadata } from "@/utils/ipfs-cache";
import { DareIPFSMetadata } from "@/types";
import { useProfiles } from "@/hooks/use-profiles";

interface DareTableProps {}

const DareTable: React.FC<DareTableProps> = () => {
  const [pageSize, setPageSize] = useState<number>(50);
  const [daresData, setDaresData] = useState<DareItem[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [dareStatus, setDareStatus] = useState<string>("");
  const [submissionStatus, setSubmissionStatus] = useState<string>("all");
  const [open, setOpen] = useState<boolean>(false);
  const [selectedDare, setSelectedDare] = useState<DareItem>();
  const [searchText, setSearchText] = useState<string>("");
  const [ipfsMetadataMap, setIpfsMetadataMap] = useState<
    Map<string, DareIPFSMetadata>
  >(new Map());
  const [loadingMetadata, setLoadingMetadata] = useState<boolean>(false);

  // Cursor-based pagination state
  const [currentCursor, setCurrentCursor] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [previousCursors, setPreviousCursors] = useState<string[]>([]);
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);
  const [hasPreviousPage, setHasPreviousPage] = useState<boolean>(false);

  const { toast } = useToast();

  /**
   * Fetch dares with cursor-based pagination
   */
  const fetchDares = useCallback(
    async (cursor: string | null = null, isNext: boolean = true) => {
      const apiEndpoint = "/dare/get-all";
      setLoadingData(true);

      try {
        const params: Record<string, string | number> = {
          limit: pageSize,
        };

        if (dareStatus) params.status = dareStatus;
        if (cursor) params.cursor = cursor;
        if (submissionStatus && dareStatus === "accepted") {
          params.submissionStatus = submissionStatus;
        }
        // Note: searchText functionality would need to be implemented on the backend
        // if (searchText) params.search = searchText;

        const response = await axios.get(apiEndpoint, { params });

        if (!response.data?.success) {
          toast({
            title: "Error",
            description: response.data?.message || "Internal Server Error",
            variant: "destructive",
          });
          setLoadingData(false);
          return;
        }

        if (response.data.data) {
          setDaresData(response.data.data);

          // Update cursor state for pagination
          if (isNext) {
            // Moving forward
            setCurrentCursor((prevCursor) => {
              if (prevCursor) {
                setPreviousCursors((prev) => [...prev, prevCursor]);
              }
              return cursor;
            });
          } else {
            // Moving backward
            setCurrentCursor(cursor);
          }

          // Determine if there are more pages
          // Since we don't get total count, we determine next page by checking if we got full page
          setHasNextPage(response.data.data.length === pageSize);
          setPreviousCursors((prevCursors) => {
            setHasPreviousPage(
              prevCursors.length > 0 || (cursor !== null && !isNext)
            );
            return prevCursors;
          });

          // Set next cursor to the tokenMint of the last item
          if (response.data.data.length > 0) {
            const lastItem = response.data.data[response.data.data.length - 1];
            setNextCursor(lastItem.tokenMint);
          }
        }
      } catch (error) {
        console.error("Error fetching dares:", error);
        toast({
          title: "Error",
          description: "Failed to fetch dares. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoadingData(false);
      }
    },
    [pageSize, dareStatus, submissionStatus, toast]
  );

  useEffect(() => {
    // Reset pagination state when filters change
    setCurrentCursor(null);
    setNextCursor(null);
    setPreviousCursors([]);
    setHasNextPage(false);
    setHasPreviousPage(false);

    fetchDares();
  }, [pageSize, dareStatus, submissionStatus, fetchDares]);

  /**
   * Fetch IPFS metadata for all dares on the current page
   */
  useEffect(() => {
    if (daresData.length === 0) {
      setIpfsMetadataMap(new Map());
      return;
    }

    const fetchMetadata = async () => {
      setLoadingMetadata(true);

      try {
        // Extract all CIDs from current page dares
        const cids = daresData
          .map((dare) => dare.ipfsCid)
          .filter((cid) => cid && cid.trim() !== "");

        // Prefetch all metadata in parallel
        const metadataMap = await prefetchIPFSMetadata(cids);
        setIpfsMetadataMap(metadataMap);

        // Debug: Log all loaded metadata

        const allTitles: string[] = [];
        metadataMap.forEach((metadata, cid) => {
          if (metadata?.name) {
            allTitles.push(metadata.name);
          }
        });
      } catch (error) {
        console.error("Error fetching IPFS metadata:", error);
        // Don't show error toast - fail silently for search
      } finally {
        setLoadingMetadata(false);
      }
    };

    fetchMetadata();
  }, [daresData]);

  /**
   * Extract unique creator wallets from daresData for profile fetching
   */
  const creatorWallets = useMemo(() => {
    return Array.from(new Set(daresData.map((dare) => dare.creator)));
  }, [daresData]);

  /**
   * Fetch profiles for all creators on current page
   */
  const { profiles, isLoading: profilesLoading } = useProfiles(creatorWallets);

  /**
   * Filter dares on the frontend based on search text
   * All status filters (including expired) are handled by the backend
   */
  const filteredDares = useMemo(() => {
    let filtered = daresData;

    // Apply search filter by title
    if (searchText && searchText.trim() !== "") {
      const searchLower = searchText.toLowerCase().trim();

      filtered = filtered.filter((dare) => {
        // Get metadata from the map
        const metadata = ipfsMetadataMap.get(dare.ipfsCid);

        const hasMetadata = !!metadata;
        const hasTitle = !!metadata?.name;
        const title = metadata?.name || "";

        // If no metadata or no title, include in results (don't filter out)
        // This allows all dares to show when metadata is loading or missing
        if (!metadata || !metadata.name) {
          return true;
        }

        // Only filter based on title match if metadata exists (case-insensitive LIKE operation)
        const titleLower = metadata.name.toLowerCase();
        const matches = titleLower.includes(searchLower);

        return matches;
      });
    }

    const filteredTitles = filtered
      .map((dare) => ipfsMetadataMap.get(dare.ipfsCid)?.title || "[NO TITLE]")
      .slice(0, 10); // Only show first 10 to avoid console spam

    return filtered;
  }, [daresData, searchText, ipfsMetadataMap]);

  /**
   * Handle dare status change
   * Reset submission status when dare status is not "accepted"
   */
  const handleDareStatusChange = (value: string) => {
    // All status filters (including expired) are handled by backend
    setDareStatus(value === "AllStatus" ? "" : value.toLowerCase());

    // Reset submission status if dare status is not "accepted"
    if (value.toLowerCase() !== "accepted") {
      setSubmissionStatus("all");
    }
  };

  const handleDareSelection = async (user: DareItem) => {
    setSelectedDare(user);
    setOpen(true);
  };

  const handleDareUpdate = (updatedDare: DareItem) => {
    // Update the dare in the daresData array
    setDaresData((prevData) =>
      prevData.map((dare) =>
        dare.tokenMint === updatedDare.tokenMint ? updatedDare : dare
      )
    );

    // Update the selected dare as well
    setSelectedDare(updatedDare);
  };

  /**
   * Handle next page navigation
   */
  const handleNextPage = () => {
    if (hasNextPage && nextCursor) {
      fetchDares(nextCursor, true);
    }
  };

  /**
   * Handle previous page navigation
   */
  const handlePreviousPage = () => {
    if (hasPreviousPage && previousCursors.length > 0) {
      const prevCursor = previousCursors[previousCursors.length - 1];
      setPreviousCursors((prev) => prev.slice(0, -1));
      fetchDares(prevCursor, false);
    } else if (hasPreviousPage && previousCursors.length === 0) {
      // Go to first page
      setPreviousCursors([]);
      setCurrentCursor(null);
      fetchDares(null, false);
    }
  };

  return (
    <div className="">
      <div className="">
        {/* Search and loading status */}
        {(searchText.trim() !== "" || loadingMetadata) && (
          <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            {loadingMetadata && (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Loading dare titles...
              </span>
            )}
            {!loadingMetadata && searchText.trim() !== "" && (
              <span>
                Showing {filteredDares.length} of {daresData.length} dares
                matching &quot;{searchText}&quot;
              </span>
            )}
          </div>
        )}

        <DataTable<DareItem>
          data={filteredDares}
          pageSize={pageSize}
          setPageSize={setPageSize}
          onSearch={(value: string) => {
            setSearchText(value);
          }}
          title="Dares"
          description="Review and manage dare submissions"
          columns={DareTableColumns({
            actions: (rowData: DareItem) => [
              // {
              //   id: "deleted",
              //   name: "Delete",
              //   onClick: () => {
              //     console.log(rowData);
              //   },
              // },
            ],
            profiles: profiles,
            profilesLoading: profilesLoading,
          })}
          enableRowClick
          handleRowClick={handleDareSelection}
          loadingData={loadingData}
          customFilters={[
            <Select
              key="dare-status-filter"
              value={
                dareStatus
                  ? dareStatus.charAt(0).toUpperCase() + dareStatus.slice(1)
                  : "AllStatus"
              }
              onValueChange={handleDareStatusChange}
            >
              <SelectTrigger className="w-[180px] border-accent-foreground/10">
                <SelectValue placeholder="Dare Status" />
              </SelectTrigger>
              <SelectContent>
                {DareStatusFilter.map((status) => (
                  <SelectItem key={status.id} value={status.id}>
                    {status.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>,
            dareStatus === "accepted" && (
              <Select
                key="submission-status-filter"
                value={submissionStatus}
                onValueChange={setSubmissionStatus}
              >
                <SelectTrigger className="w-[180px] border-accent-foreground/10">
                  <SelectValue placeholder="Submission Status" />
                </SelectTrigger>
                <SelectContent>
                  {SubmissionStatusFilter.map((status) => (
                    <SelectItem key={status.id} value={status.id}>
                      {status.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ),
          ].filter(Boolean)}
          // Cursor-based pagination props
          hasNextPage={hasNextPage}
          hasPreviousPage={hasPreviousPage}
          onNextPage={handleNextPage}
          onPreviousPage={handlePreviousPage}
        />
        {selectedDare && (
          <SlidingSheet
            open={open}
            setOpen={setOpen}
            title="Dare Details"
            actions={[
              {
                id: "cancel",
                type: "cancel",
                name: "Close",
                onClick() {
                  setOpen(false);
                },
              },
            ]}
          >
            <DareInfoForm dare={selectedDare} onUpdate={handleDareUpdate} />
          </SlidingSheet>
        )}
      </div>
    </div>
  );
};

export default DareTable;
